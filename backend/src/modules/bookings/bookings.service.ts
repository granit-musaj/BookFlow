import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { throwIfBookingConflict } from '../../common/errors/prisma-errors';
import { localSlotMinutes, rangesOverlap } from '../../common/time/schedule';
import { assertSameTenant } from '../../common/tenant';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessesRepository } from '../businesses/businesses.repository';
import { ServicesRepository } from '../services/services.repository';
import { StaffRepository } from '../staff/staff.repository';
import { UsersRepository } from '../users/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingNotificationEvent } from '../notifications/notification-recipients';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsRepository,
    private readonly staff: StaffRepository,
    private readonly services: ServicesRepository,
    private readonly users: UsersRepository,
    private readonly businesses: BusinessesRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthUser) {
    const where =
      user.role === 'OWNER'
        ? { businessId: user.businessId }
        : user.role === 'STAFF'
          ? { businessId: user.businessId, staff: { userId: user.id } }
          : { businessId: user.businessId, clientId: user.id };

    const rows = await this.bookings.list(where);
    return rows.map((row) => this.toPublic(row));
  }

  async create(user: AuthUser, dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('startAt must be a valid ISO date');
    }
    if (startAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Cannot book a time in the past');
    }

    const [business, service, staff] = await Promise.all([
      this.businesses.findById(user.businessId),
      this.services.findById(dto.serviceId),
      this.staff.findById(dto.staffId),
    ]);

    if (!business) {
      throw new NotFoundException();
    }
    assertSameTenant(service?.businessId, user.businessId);
    assertSameTenant(staff?.businessId, user.businessId);
    if (!service || !staff) {
      throw new NotFoundException();
    }
    if (!service.isActive || !staff.isActive) {
      throw new BadRequestException('This staff member or service is not available');
    }

    const offersService = staff.staffServices.some((link) => link.service.id === service.id);
    if (!offersService) {
      throw new BadRequestException('This staff member does not offer that service');
    }

    const clientId = await this.resolveClientId(user, dto.clientId);
    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

    this.assertFitsAvailability(startAt, endAt, business.timezone, staff.availabilities);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const locked = await this.bookings.lockStaff(tx, staff.id, user.businessId);
        if (locked.length === 0) {
          throw new NotFoundException();
        }

        const overlapping = await this.bookings.findOverlapping(tx, staff.id, startAt, endAt);
        if (overlapping.some((row) => rangesOverlap(startAt, endAt, row.startAt, row.endAt))) {
          throw new ConflictException('This time slot is no longer available');
        }

        return this.bookings.create(tx, {
          businessId: user.businessId,
          clientId,
          staffId: staff.id,
          serviceId: service.id,
          startAt,
          endAt,
          notes: dto.notes?.trim() || undefined,
        });
      });

      await this.notify('BOOKING_CREATED', user.id, created);
      return this.toPublic(created);
    } catch (error) {
      throwIfBookingConflict(error);
      throw error;
    }
  }

  async confirm(user: AuthUser, id: string) {
    const booking = await this.requireBooking(id, user.businessId);
    this.assertStaffOrOwner(user, booking.staff.userId);

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    const updated = await this.bookings.updateStatus(id, 'CONFIRMED');
    await this.notify('BOOKING_CONFIRMED', user.id, updated);
    await this.notifications.scheduleBookingReminders(updated.id, updated.startAt);
    return this.toPublic(updated);
  }

  async cancel(user: AuthUser, id: string) {
    const booking = await this.requireBooking(id, user.businessId);
    this.assertCanCancel(user, booking);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const updated = await this.bookings.updateStatus(id, 'CANCELLED');
    await this.notifications.cancelBookingReminders(updated.id);
    await this.notify('BOOKING_CANCELLED', user.id, updated);
    return this.toPublic(updated);
  }

  private async resolveClientId(user: AuthUser, requestedClientId?: string) {
    if (user.role === 'CLIENT') {
      return user.id;
    }

    if (!requestedClientId) {
      throw new BadRequestException('clientId is required when booking on behalf of a client');
    }

    const client = await this.users.findById(requestedClientId);
    assertSameTenant(client?.businessId, user.businessId);
    if (!client || client.role !== 'CLIENT') {
      throw new NotFoundException('Client not found');
    }

    return client.id;
  }

  private assertFitsAvailability(
    startAt: Date,
    endAt: Date,
    timeZone: string,
    windows: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  ) {
    let slot: ReturnType<typeof localSlotMinutes>;
    try {
      slot = localSlotMinutes(startAt, endAt, timeZone);
    } catch (error) {
      if (error instanceof Error && error.message === 'CROSSES_MIDNIGHT') {
        throw new BadRequestException('Bookings that cross midnight are not supported yet');
      }
      throw error;
    }

    const fits = windows.some(
      (window) =>
        window.dayOfWeek === slot.dayOfWeek &&
        slot.startMinutes >= this.toMinutes(window.startTime) &&
        slot.endMinutes <= this.toMinutes(window.endTime),
    );

    if (!fits) {
      throw new BadRequestException('Selected time is outside staff working hours');
    }
  }

  private toMinutes(hhmm: string) {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async requireBooking(id: string, businessId: string) {
    const booking = await this.bookings.findById(id);
    assertSameTenant(booking?.businessId, businessId);
    if (!booking) {
      throw new NotFoundException();
    }
    return booking;
  }

  private assertStaffOrOwner(user: AuthUser, staffUserId: string) {
    if (user.role === 'OWNER' || (user.role === 'STAFF' && user.id === staffUserId)) {
      return;
    }
    throw new ForbiddenException();
  }

  private assertCanCancel(
    user: AuthUser,
    booking: { clientId: string; staff: { userId: string }; status: BookingStatus },
  ) {
    if (user.role === 'OWNER') {
      return;
    }
    if (user.role === 'STAFF' && user.id === booking.staff.userId) {
      return;
    }
    if (user.role === 'CLIENT' && user.id === booking.clientId) {
      return;
    }
    throw new ForbiddenException();
  }

  private async notify(
    event: BookingNotificationEvent,
    actorUserId: string,
    booking: NonNullable<Awaited<ReturnType<BookingsRepository['findById']>>>,
  ) {
    try {
      await this.notifications.dispatchBookingEvent({
        event,
        actorUserId,
        businessId: booking.businessId,
        bookingId: booking.id,
        clientId: booking.clientId,
        staffUserId: booking.staff.userId,
        serviceName: booking.service.name,
        staffName: booking.staff.displayName,
        clientName: `${booking.client.firstName} ${booking.client.lastName}`.trim(),
        startAt: booking.startAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to dispatch ${event} for booking ${booking.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private toPublic(row: NonNullable<Awaited<ReturnType<BookingsRepository['findById']>>>) {
    return {
      id: row.id,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status,
      notes: row.notes,
      staff: row.staff,
      service: row.service,
      client: row.client,
    };
  }
}

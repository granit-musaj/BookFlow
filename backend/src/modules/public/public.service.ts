import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';
import { zonedLocalToUtc } from '../../common/time/schedule';
import { BookingsRepository } from '../bookings/bookings.repository';
import { BookingsService } from '../bookings/bookings.service';
import { BusinessesRepository } from '../businesses/businesses.repository';
import { ServicesRepository } from '../services/services.repository';
import { StaffRepository } from '../staff/staff.repository';
import { PublicBookingDto } from './dto/public-booking.dto';
import { generateOpenSlots, parseIsoDate } from './slots';

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly businesses: BusinessesRepository,
    private readonly services: ServicesRepository,
    private readonly staff: StaffRepository,
    private readonly bookings: BookingsRepository,
    private readonly bookingsService: BookingsService,
  ) {}

  async catalog(slug: string) {
    const business = await this.requireBusiness(slug);
    const [services, staff] = await Promise.all([
      this.services.findManyInBusiness(business.id, true),
      this.staff.listByBusiness(business.id, true),
    ]);

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        timezone: business.timezone,
      },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      })),
      staff: staff
        .map((row) => ({
          id: row.id,
          displayName: row.displayName,
          serviceIds: row.staffServices
            .filter((link) => link.service.isActive)
            .map((link) => link.service.id),
        }))
        .filter((row) => row.serviceIds.length > 0),
    };
  }

  async slots(slug: string, query: { serviceId: string; staffId: string; date: string }) {
    const business = await this.requireBusiness(slug);
    const [service, staff] = await Promise.all([
      this.services.findById(query.serviceId),
      this.staff.findById(query.staffId),
    ]);

    if (!service || service.businessId !== business.id || !service.isActive) {
      throw new NotFoundException();
    }
    if (!staff || staff.businessId !== business.id || !staff.isActive) {
      throw new NotFoundException();
    }
    if (!staff.staffServices.some((link) => link.service.id === service.id && link.service.isActive)) {
      throw new BadRequestException('This staff member does not offer that service');
    }

    let dateParts: ReturnType<typeof parseIsoDate>;
    try {
      dateParts = parseIsoDate(query.date);
    } catch {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }

    const from = zonedLocalToUtc(dateParts.year, dateParts.month, dateParts.day, 0, business.timezone);
    const to = zonedLocalToUtc(
      dateParts.year,
      dateParts.month,
      dateParts.day,
      24 * 60,
      business.timezone,
    );

    const bookings = await this.bookings.findActiveForStaffBetween(staff.id, from, to);
    const slots = generateOpenSlots({
      date: query.date,
      timeZone: business.timezone,
      durationMinutes: service.durationMinutes,
      windows: staff.availabilities,
      bookings,
      now: new Date(),
    });

    return {
      date: query.date,
      timezone: business.timezone,
      slots: slots.map((startAt) => ({ startAt: startAt.toISOString() })),
    };
  }

  async book(slug: string, user: AuthUser, dto: PublicBookingDto) {
    const business = await this.requireBusiness(slug);
    if (user.role !== 'CLIENT' || user.businessId !== business.id) {
      throw new ForbiddenException('Sign in with a client account for this business to book');
    }

    return this.bookingsService.create(user, dto);
  }

  private async requireBusiness(slug: string) {
    const business = await this.businesses.findBySlug(slug.trim());
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}

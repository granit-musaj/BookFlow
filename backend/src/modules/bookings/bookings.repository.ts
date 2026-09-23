import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const bookingInclude = {
  staff: { select: { id: true, displayName: true, userId: true } },
  service: { select: { id: true, name: true, durationMinutes: true, priceCents: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.BookingInclude;

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  }

  list(where: Prisma.BookingWhereInput) {
    return this.prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  findActiveForStaffBetween(staffId: string, from: Date, to: Date) {
    return this.prisma.booking.findMany({
      where: {
        staffId,
        status: { not: 'CANCELLED' },
        startAt: { lt: to },
        endAt: { gt: from },
      },
      select: { startAt: true, endAt: true },
    });
  }

  findOverlapping(
    tx: Prisma.TransactionClient,
    staffId: string,
    startAt: Date,
    endAt: Date,
  ) {
    return tx.booking.findMany({
      where: {
        staffId,
        status: { not: 'CANCELLED' },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true },
    });
  }

  lockStaff(tx: Prisma.TransactionClient, staffId: string, businessId: string) {
    return tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM staff
      WHERE id = ${staffId} AND business_id = ${businessId}
      FOR UPDATE
    `;
  }

  create(
    tx: Prisma.TransactionClient,
    data: {
      businessId: string;
      clientId: string;
      staffId: string;
      serviceId: string;
      startAt: Date;
      endAt: Date;
      notes?: string;
    },
  ) {
    return tx.booking.create({
      data: {
        ...data,
        status: 'PENDING',
      },
      include: bookingInclude,
    });
  }

  updateStatus(id: string, status: BookingStatus) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: bookingInclude,
    });
  }
}

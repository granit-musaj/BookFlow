import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMany(
    rows: Array<{
      type: NotificationType;
      title: string;
      body: string;
      businessId: string;
      userId: string;
      bookingId: string;
      offsetMinutes?: number;
    }>,
  ) {
    return this.prisma.$transaction(
      rows.map((data) => this.prisma.notification.create({ data })),
    );
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, role: true, isActive: true } },
      },
    });
  }

  findBookingForReminder(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startAt: true,
        businessId: true,
        clientId: true,
        staff: { select: { displayName: true, userId: true } },
        service: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });
  }

  hasReminder(bookingId: string, userId: string, offsetMinutes: number) {
    return this.prisma.notification.findFirst({
      where: {
        bookingId,
        userId,
        type: 'BOOKING_REMINDER',
        offsetMinutes,
      },
      select: { id: true },
    });
  }

  listForUser(userId: string, businessId: string) {
    return this.prisma.notification.findMany({
      where: { userId, businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(userId: string, businessId: string) {
    return this.prisma.notification.count({
      where: { userId, businessId, readAt: null },
    });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string, businessId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, businessId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markEmailed(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { emailedAt: new Date() },
    });
  }
}

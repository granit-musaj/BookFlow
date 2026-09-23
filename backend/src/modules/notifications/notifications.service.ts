import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { assertSameTenant } from '../../common/tenant';
import { AuthUser } from '../../common/types/auth-user.type';
import { UsersRepository } from '../users/users.repository';
import { buildNotificationCopy } from './notification-copy';
import {
  BookingNotificationEvent,
  recipientUserIds,
} from './notification-recipients';
import {
  BOOKING_REMINDER_JOB,
  BookingReminderJob,
  NOTIFICATIONS_QUEUE,
  SEND_EMAIL_JOB,
} from './notifications.queue';
import { NotificationsRepository } from './notifications.repository';
import {
  DEFAULT_REMINDER_OFFSETS_MINUTES,
  isCatchUpReminder,
  reminderDelayMs,
  reminderJobId,
} from './reminder-schedule';

export type BookingEventPayload = {
  event: BookingNotificationEvent;
  actorUserId: string;
  businessId: string;
  bookingId: string;
  clientId: string;
  staffUserId: string;
  serviceName: string;
  staffName: string;
  clientName: string;
  startAt: Date;
  offsetMinutes?: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly users: UsersRepository,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async dispatchBookingEvent(payload: BookingEventPayload) {
    const owners = await this.users.findOwners(payload.businessId);
    const recipientIds = recipientUserIds({
      event: payload.event,
      actorUserId: payload.actorUserId,
      clientId: payload.clientId,
      staffUserId: payload.staffUserId,
      ownerIds: owners.map((owner) => owner.id),
    });

    const recipients = await this.users.findActiveByIds(recipientIds, payload.businessId);
    const snapshot = {
      serviceName: payload.serviceName,
      staffName: payload.staffName,
      clientName: payload.clientName,
      startAt: payload.startAt,
      offsetMinutes: payload.offsetMinutes,
    };

    const rows = [];
    for (const recipient of recipients) {
      if (payload.event === 'BOOKING_REMINDER' && payload.offsetMinutes != null) {
        const existing = await this.notifications.hasReminder(
          payload.bookingId,
          recipient.id,
          payload.offsetMinutes,
        );
        if (existing) {
          continue;
        }
      }

      const copy = buildNotificationCopy(payload.event, snapshot, recipient.role);
      rows.push({
        type: payload.event,
        title: copy.title,
        body: copy.body,
        businessId: payload.businessId,
        userId: recipient.id,
        bookingId: payload.bookingId,
        offsetMinutes: payload.offsetMinutes,
      });
    }

    if (rows.length === 0) {
      return;
    }

    const created = await this.notifications.createMany(rows);
    await Promise.all(created.map((row) => this.enqueueEmail(row.id)));
  }

  async scheduleBookingReminders(bookingId: string, startAt: Date) {
    try {
      for (const offsetMinutes of DEFAULT_REMINDER_OFFSETS_MINUTES) {
        if (isCatchUpReminder(startAt, offsetMinutes)) {
          await this.sendDueReminder({ bookingId, offsetMinutes });
          continue;
        }

        const delay = reminderDelayMs(startAt, offsetMinutes);
        if (delay == null) {
          continue;
        }

        await this.queue.add(
          BOOKING_REMINDER_JOB,
          { bookingId, offsetMinutes } satisfies BookingReminderJob,
          {
            delay,
            jobId: reminderJobId(bookingId, offsetMinutes),
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        );
      }
    } catch (error) {
      this.logger.warn(`Could not schedule reminders for ${bookingId}`);
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }
  }

  async cancelBookingReminders(bookingId: string) {
    for (const offsetMinutes of DEFAULT_REMINDER_OFFSETS_MINUTES) {
      try {
        await this.queue.remove(reminderJobId(bookingId, offsetMinutes));
      } catch (error) {
        this.logger.debug(error instanceof Error ? error.message : String(error));
      }
    }
  }

  async sendDueReminder(job: BookingReminderJob) {
    const booking = await this.notifications.findBookingForReminder(job.bookingId);
    if (!booking || booking.status !== 'CONFIRMED') {
      return;
    }
    if (booking.startAt.getTime() <= Date.now()) {
      return;
    }

    await this.dispatchBookingEvent({
      event: 'BOOKING_REMINDER',
      actorUserId: 'system',
      businessId: booking.businessId,
      bookingId: booking.id,
      clientId: booking.clientId,
      staffUserId: booking.staff.userId,
      serviceName: booking.service.name,
      staffName: booking.staff.displayName,
      clientName: `${booking.client.firstName} ${booking.client.lastName}`.trim(),
      startAt: booking.startAt,
      offsetMinutes: job.offsetMinutes,
    });
  }

  list(user: AuthUser) {
    return this.notifications.listForUser(user.id, user.businessId);
  }

  unreadCount(user: AuthUser) {
    return this.notifications.unreadCount(user.id, user.businessId);
  }

  async markRead(user: AuthUser, id: string) {
    const row = await this.notifications.findById(id);
    assertSameTenant(row?.businessId, user.businessId);
    if (!row || row.userId !== user.id) {
      throw new NotFoundException();
    }

    await this.notifications.markRead(id, user.id);
    return { success: true };
  }

  async markAllRead(user: AuthUser) {
    await this.notifications.markAllRead(user.id, user.businessId);
    return { success: true };
  }

  private async enqueueEmail(notificationId: string) {
    try {
      await this.queue.add(
        SEND_EMAIL_JOB,
        { notificationId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Redis/BullMQ unavailable — in-app notification ${notificationId} stored, email skipped`,
      );
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }
  }
}

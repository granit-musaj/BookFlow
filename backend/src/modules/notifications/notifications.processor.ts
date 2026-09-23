import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Mailer, MAILER } from './mailer/mailer';
import {
  BOOKING_REMINDER_JOB,
  BookingReminderJob,
  NOTIFICATIONS_QUEUE,
  SendEmailJob,
} from './notifications.queue';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly service: NotificationsService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {
    super();
  }

  async process(job: Job<SendEmailJob | BookingReminderJob>): Promise<void> {
    if (job.name === BOOKING_REMINDER_JOB) {
      await this.service.sendDueReminder(job.data as BookingReminderJob);
      return;
    }

    const data = job.data as SendEmailJob;
    const row = await this.notifications.findById(data.notificationId);
    if (!row) {
      this.logger.warn(`Notification ${data.notificationId} no longer exists`);
      return;
    }

    if (row.emailedAt || !row.user.isActive) {
      return;
    }

    await this.mailer.send({
      to: row.user.email,
      subject: row.title,
      text: row.body,
    });

    await this.notifications.markEmailed(row.id);
  }
}

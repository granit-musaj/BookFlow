import { Injectable, Logger } from '@nestjs/common';
import { Mailer, MailMessage } from './mailer';

/** Në prod e zëvendëson me SMTP/Resend. Kontrata mbetet e njëjtë. */
@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`[mail] to=${message.to} subject="${message.subject}" body="${message.text}"`);
  }
}

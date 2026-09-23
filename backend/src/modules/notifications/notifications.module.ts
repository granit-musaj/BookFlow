import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseRedisUrl } from '../../common/redis';
import { UsersModule } from '../users/users.module';
import { ConsoleMailer } from './mailer/console.mailer';
import { MAILER } from './mailer/mailer';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NOTIFICATIONS_QUEUE } from './notifications.queue';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    UsersModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisUrl(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
      }),
    }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsProcessor,
    { provide: MAILER, useClass: ConsoleMailer },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

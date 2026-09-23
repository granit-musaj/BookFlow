import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  imports: [UsersModule, BusinessesModule, ServicesModule, StaffModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}

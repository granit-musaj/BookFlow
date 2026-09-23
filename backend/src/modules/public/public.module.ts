import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';
import { PublicController } from './public.controller';
import { PublicCatalogService } from './public.service';

@Module({
  imports: [BusinessesModule, ServicesModule, StaffModule, BookingsModule],
  controllers: [PublicController],
  providers: [PublicCatalogService],
})
export class PublicModule {}

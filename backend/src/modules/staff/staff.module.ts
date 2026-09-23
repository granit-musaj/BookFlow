import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { StaffController } from './staff.controller';
import { StaffRepository } from './staff.repository';
import { StaffService } from './staff.service';

@Module({
  imports: [UsersModule, ServicesModule],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository],
  exports: [StaffRepository],
})
export class StaffModule {}

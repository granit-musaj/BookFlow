import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.staff.list(user);
  }

  @Roles('STAFF')
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.staff.me(user);
  }

  @Roles('OWNER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto) {
    return this.staff.create(user, dto);
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staff.update(user, id, dto);
  }

  @Get(':id/availability')
  listAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staff.listAvailability(user, id);
  }

  @Roles('OWNER', 'STAFF')
  @Post(':id/availability')
  addAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.staff.addAvailability(user, id, dto);
  }

  @Roles('OWNER', 'STAFF')
  @Delete(':id/availability/:availabilityId')
  removeAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
  ) {
    return this.staff.removeAvailability(user, id, availabilityId);
  }
}

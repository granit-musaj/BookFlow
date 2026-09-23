import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateClientDto } from './dto/create-client.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('OWNER', 'STAFF')
  @Get('clients')
  listClients(@CurrentUser() user: AuthUser) {
    return this.users.listClients(user);
  }

  @Roles('OWNER', 'STAFF')
  @Post('clients')
  createClient(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.users.createClient(user, dto);
  }
}

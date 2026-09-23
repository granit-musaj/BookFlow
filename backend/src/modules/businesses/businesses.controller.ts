import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { BusinessesService } from './businesses.service';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.businesses.me(user);
  }

  @Roles('OWNER')
  @Get('me/stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.businesses.stats(user);
  }
}

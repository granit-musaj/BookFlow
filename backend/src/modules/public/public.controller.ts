import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { PublicBookingDto } from './dto/public-booking.dto';
import { SlotsQueryDto } from './dto/slots-query.dto';
import { PublicCatalogService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Public()
  @Get('businesses/:slug')
  getCatalog(@Param('slug') slug: string) {
    return this.catalog.catalog(slug);
  }

  @Public()
  @Get('businesses/:slug/slots')
  getSlots(@Param('slug') slug: string, @Query() query: SlotsQueryDto) {
    return this.catalog.slots(slug, query);
  }

  @ApiBearerAuth()
  @Roles('CLIENT')
  @Post('businesses/:slug/bookings')
  book(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: PublicBookingDto,
  ) {
    return this.catalog.book(slug, user, dto);
  }
}

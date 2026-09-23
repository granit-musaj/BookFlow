import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';
import { BusinessesRepository } from './businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businesses: BusinessesRepository) {}

  async me(user: AuthUser) {
    const business = await this.businesses.findById(user.businessId);
    if (!business) {
      throw new NotFoundException();
    }

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
    };
  }
}

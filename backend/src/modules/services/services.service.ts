import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';
import { assertSameTenant } from '../../common/tenant';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(private readonly services: ServicesRepository) {}

  create(user: AuthUser, dto: CreateServiceDto) {
    return this.services.create({
      businessId: user.businessId,
      name: dto.name.trim(),
      durationMinutes: dto.durationMinutes,
      priceCents: dto.priceCents,
    });
  }

  list(user: AuthUser) {
    const activeOnly = user.role === 'CLIENT';
    return this.services.findManyInBusiness(user.businessId, activeOnly);
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceDto) {
    const service = await this.services.findById(id);
    assertSameTenant(service?.businessId, user.businessId);
    if (!service) {
      throw new NotFoundException();
    }

    return this.services.update(id, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
      ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }
}

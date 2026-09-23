import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    businessId: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }) {
    return this.prisma.service.create({ data });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  findManyInBusiness(businessId: string, activeOnly: boolean) {
    return this.prisma.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  findByIdsInBusiness(ids: string[], businessId: string) {
    return this.prisma.service.findMany({
      where: { id: { in: ids }, businessId },
    });
  }

  update(
    id: string,
    data: Prisma.ServiceUpdateInput,
  ) {
    return this.prisma.service.update({ where: { id }, data });
  }
}

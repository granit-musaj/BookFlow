import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.business.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.business.findUnique({ where: { slug } });
  }

  listActiveBookingsBetween(businessId: string, from: Date, to: Date) {
    return this.prisma.booking.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        startAt: { gte: from, lt: to },
      },
      select: {
        startAt: true,
        service: { select: { priceCents: true } },
      },
    });
  }

  createInTransaction(
    tx: Prisma.TransactionClient,
    data: { name: string; slug: string },
  ) {
    return tx.business.create({ data });
  }
}

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

  createInTransaction(
    tx: Prisma.TransactionClient,
    data: { name: string; slug: string },
  ) {
    return tx.business.create({ data });
  }
}

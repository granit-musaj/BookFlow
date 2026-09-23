import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: Role;
    businessId: string;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  }

  findOwners(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId, role: 'OWNER', isActive: true },
      select: { id: true, email: true, role: true, firstName: true },
    });
  }

  findActiveByIds(ids: string[], businessId: string) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.user.findMany({
      where: { id: { in: ids }, businessId, isActive: true },
      select: { id: true, email: true, role: true, firstName: true },
    });
  }

  findClients(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId, role: 'CLIENT' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  createInTransaction(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: Role;
      businessId: string;
    },
  ) {
    return tx.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  }
}

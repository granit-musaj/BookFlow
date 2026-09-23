import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const staffInclude = {
  user: {
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  },
  staffServices: {
    select: {
      service: {
        select: { id: true, name: true, durationMinutes: true, priceCents: true, isActive: true },
      },
    },
  },
  availabilities: {
    orderBy: [{ dayOfWeek: 'asc' as const }, { startTime: 'asc' as const }],
  },
};

@Injectable()
export class StaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.staff.findUnique({ where: { id }, include: staffInclude });
  }

  findByUserId(userId: string) {
    return this.prisma.staff.findUnique({ where: { userId }, include: staffInclude });
  }

  listByBusiness(businessId: string, activeOnly: boolean) {
    return this.prisma.staff.findMany({
      where: {
        businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: staffInclude,
      orderBy: { displayName: 'asc' },
    });
  }

  createInTransaction(
    tx: Prisma.TransactionClient,
    data: {
      businessId: string;
      userId: string;
      displayName: string;
      serviceIds: string[];
    },
  ) {
    return tx.staff.create({
      data: {
        businessId: data.businessId,
        userId: data.userId,
        displayName: data.displayName,
        staffServices: {
          create: data.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: staffInclude,
    });
  }

  update(id: string, data: { displayName?: string; isActive?: boolean }) {
    return this.prisma.staff.update({
      where: { id },
      data,
      include: staffInclude,
    });
  }

  replaceServices(id: string, serviceIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.staffService.deleteMany({ where: { staffId: id } });
      if (serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
        });
      }
      return tx.staff.findUniqueOrThrow({ where: { id }, include: staffInclude });
    });
  }

  listAvailability(staffId: string) {
    return this.prisma.availability.findMany({
      where: { staffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  createAvailability(data: {
    businessId: string;
    staffId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) {
    return this.prisma.availability.create({ data });
  }

  findAvailabilityById(id: string) {
    return this.prisma.availability.findUnique({ where: { id } });
  }

  deleteAvailability(id: string) {
    return this.prisma.availability.delete({ where: { id } });
  }
}

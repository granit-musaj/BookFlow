import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../../common/constants';
import { parseMinutes } from '../../common/time/schedule';
import { assertSameTenant } from '../../common/tenant';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ServicesRepository } from '../services/services.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffRepository } from './staff.repository';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staff: StaffRepository,
    private readonly users: UsersRepository,
    private readonly services: ServicesRepository,
  ) {}

  async list(user: AuthUser) {
    const rows = await this.staff.listByBusiness(user.businessId, user.role === 'CLIENT');
    return rows.map((row) => this.toPublic(row));
  }

  async me(user: AuthUser) {
    const row = await this.staff.findByUserId(user.id);
    assertSameTenant(row?.businessId, user.businessId);
    if (!row) {
      throw new NotFoundException('No staff profile is linked to this account');
    }
    return this.toPublic(row);
  }

  async create(user: AuthUser, dto: CreateStaffDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const serviceIds = dto.serviceIds ?? [];
    await this.assertServicesInTenant(serviceIds, user.businessId);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const created = await this.prisma.$transaction(async (tx) => {
      const account = await this.users.createInTransaction(tx, {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: 'STAFF',
        businessId: user.businessId,
      });

      return this.staff.createInTransaction(tx, {
        businessId: user.businessId,
        userId: account.id,
        displayName: dto.displayName.trim(),
        serviceIds,
      });
    });

    return this.toPublic(created);
  }

  async update(user: AuthUser, id: string, dto: UpdateStaffDto) {
    const row = await this.requireStaffInTenant(id, user.businessId);

    if (dto.serviceIds) {
      await this.assertServicesInTenant(dto.serviceIds, user.businessId);
      await this.staff.replaceServices(row.id, dto.serviceIds);
    }

    const updated = await this.staff.update(row.id, {
      ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.toPublic(updated);
  }

  async listAvailability(user: AuthUser, staffId: string) {
    await this.requireStaffInTenant(staffId, user.businessId);
    return this.staff.listAvailability(staffId);
  }

  async addAvailability(user: AuthUser, staffId: string, dto: CreateAvailabilityDto) {
    const row = await this.requireStaffInTenant(staffId, user.businessId);
    this.assertCanEditStaff(user, row.userId);

    if (parseMinutes(dto.startTime) >= parseMinutes(dto.endTime)) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const existing = await this.staff.listAvailability(staffId);
    const overlaps = existing.some(
      (window) =>
        window.dayOfWeek === dto.dayOfWeek &&
        parseMinutes(dto.startTime) < parseMinutes(window.endTime) &&
        parseMinutes(window.startTime) < parseMinutes(dto.endTime),
    );

    if (overlaps) {
      throw new ConflictException('This availability window overlaps an existing one');
    }

    try {
      return await this.staff.createAvailability({
        businessId: user.businessId,
        staffId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      });
    } catch {
      throw new ConflictException('This availability window already exists');
    }
  }

  async removeAvailability(user: AuthUser, staffId: string, availabilityId: string) {
    const row = await this.requireStaffInTenant(staffId, user.businessId);
    this.assertCanEditStaff(user, row.userId);

    const window = await this.staff.findAvailabilityById(availabilityId);
    if (!window || window.staffId !== staffId) {
      throw new NotFoundException();
    }

    await this.staff.deleteAvailability(availabilityId);
    return { success: true };
  }

  private async requireStaffInTenant(staffId: string, businessId: string) {
    const row = await this.staff.findById(staffId);
    assertSameTenant(row?.businessId, businessId);
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  private async assertServicesInTenant(serviceIds: string[], businessId: string) {
    if (serviceIds.length === 0) {
      return;
    }

    const found = await this.services.findByIdsInBusiness(serviceIds, businessId);
    if (found.length !== serviceIds.length) {
      throw new BadRequestException('One or more services do not belong to this business');
    }
  }

  private assertCanEditStaff(user: AuthUser, staffUserId: string) {
    if (user.role === 'OWNER') {
      return;
    }
    if (user.role === 'STAFF' && user.id === staffUserId) {
      return;
    }
    throw new ForbiddenException();
  }

  private toPublic(row: NonNullable<Awaited<ReturnType<StaffRepository['findById']>>>) {
    return {
      id: row.id,
      displayName: row.displayName,
      isActive: row.isActive,
      user: row.user,
      services: row.staffServices.map((link) => link.service),
      availabilities: row.availabilities,
    };
  }
}

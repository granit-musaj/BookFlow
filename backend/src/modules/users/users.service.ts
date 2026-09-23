import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../../common/constants';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateClientDto } from './dto/create-client.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  listClients(user: AuthUser) {
    return this.users.findClients(user.businessId);
  }

  async createClient(user: AuthUser, dto: CreateClientDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const created = await this.users.create({
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: 'CLIENT',
      businessId: user.businessId,
    });

    return {
      id: created.id,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      role: created.role,
    };
  }
}

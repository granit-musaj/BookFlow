import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessesRepository } from '../businesses/businesses.repository';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetRepository } from './password-reset.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { slugify, slugWithSuffix } from './slug';
import { TokensService } from './tokens.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersRepository,
    private readonly businesses: BusinessesRepository,
    private readonly refreshTokens: RefreshTokensRepository,
    private readonly passwordResets: PasswordResetRepository,
    private readonly tokens: TokensService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user =
      dto.role === 'OWNER'
        ? await this.registerOwner(dto, passwordHash)
        : await this.registerClient(dto, passwordHash);

    return this.issueAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(user);
  }

  async refresh(rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const hash = this.tokens.hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokens.findValidByHash(hash);

    if (!stored || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotation: token-i i vjetër vdes; një i ri lëshohet.
    // Nëse dikush vjedh refresh token-in, përdorimi i dytë dështon.
    await this.refreshTokens.revoke(stored.id);

    return this.issueAuthResponse(stored.user);
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const stored = await this.refreshTokens.findValidByHash(
        this.tokens.hashRefreshToken(rawRefreshToken),
      );
      if (stored && stored.userId === userId) {
        await this.refreshTokens.revoke(stored.id);
        return { success: true };
      }
    }

    await this.refreshTokens.revokeAllForUser(userId);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (user?.isActive) {
      const raw = this.tokens.generateRefreshToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.passwordResets.create({
        userId: user.id,
        tokenHash: raw.hash,
        expiresAt,
      });
      const frontend = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
      this.logger.log(
        `[password-reset] to=${user.email} url=${frontend}/reset-password?token=${raw.raw}`,
      );
    }
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const stored = await this.passwordResets.findValidByHash(this.tokens.hashRefreshToken(token));
    if (!stored || !stored.user.isActive) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.users.updatePasswordHash(stored.userId, passwordHash);
    await this.passwordResets.markUsed(stored.id);
    await this.refreshTokens.revokeAllForUser(stored.userId);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  private async registerOwner(dto: RegisterDto, passwordHash: string) {
    const name = dto.businessName!.trim();
    let slug = slugify(name);

    return this.prisma.$transaction(async (tx) => {
      if (await tx.business.findUnique({ where: { slug } })) {
        slug = slugWithSuffix(slug);
      }

      const business = await this.businesses.createInTransaction(tx, {
        name,
        slug,
      });

      return this.users.createInTransaction(tx, {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: 'OWNER',
        businessId: business.id,
      });
    });
  }

  private async registerClient(dto: RegisterDto, passwordHash: string) {
    const business = await this.businesses.findBySlug(dto.businessSlug!.trim());
    if (!business) {
      throw new ConflictException('Business not found');
    }

    return this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: 'CLIENT',
      businessId: business.id,
    });
  }

  private async issueAuthResponse(user: User) {
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    const refresh = this.tokens.generateRefreshToken();
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt: this.tokens.refreshExpiresAt(),
    });

    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken: refresh.raw,
      },
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      businessId: user.businessId,
    };
  }
}

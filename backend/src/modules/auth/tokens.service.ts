import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  businessId: string;
};

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<`${number}${'s' | 'm' | 'h' | 'd'}`>(
        'JWT_ACCESS_EXPIRES_IN',
      ) ?? '15m',
    });
  }

  /**
   * Refresh token-i është opaque (jo JWT).
   * Klienti mban vlerën e papërpunuar; në DB ruajmë vetëm SHA-256.
   * Kështu mund ta revokojmë dhe, nëse DB rrjedh, token-i nuk është i dobishëm.
   */
  generateRefreshToken(): { raw: string; hash: string } {
    const raw = randomBytes(48).toString('base64url');
    return { raw, hash: this.hashRefreshToken(raw) };
  }

  hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  refreshExpiresAt(): Date {
    const spec = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const days = spec.endsWith('d') ? Number(spec.slice(0, -1)) : 7;
    const expires = new Date();
    expires.setDate(expires.getDate() + (Number.isFinite(days) ? days : 7));
    return expires;
  }
}

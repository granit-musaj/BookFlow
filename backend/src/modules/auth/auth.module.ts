import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BusinessesModule } from '../businesses/businesses.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetRepository } from './password-reset.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensService } from './tokens.service';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, BusinessesModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    RefreshTokensRepository,
    PasswordResetRepository,
    JwtStrategy,
  ],
})
export class AuthModule {}

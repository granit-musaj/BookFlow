import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: çdo modul mund ta injektojë PrismaService pa e importuar sërish.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

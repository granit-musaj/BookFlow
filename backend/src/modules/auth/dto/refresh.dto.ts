import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-09-23T08:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({ description: 'Required when an Owner or Staff books on behalf of a client' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

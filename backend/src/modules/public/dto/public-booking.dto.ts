import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PublicBookingDto {
  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

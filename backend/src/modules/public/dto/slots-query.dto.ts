import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class SlotsQueryDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty({ example: '2026-09-23' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;
}

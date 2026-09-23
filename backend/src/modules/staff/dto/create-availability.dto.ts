import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({ example: 1, description: '0 = Sunday … 6 = Saturday' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @Transform(({ value }) => (typeof value === 'string' ? value.slice(0, 5) : value))
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be HH:mm' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @Transform(({ value }) => (typeof value === 'string' ? value.slice(0, 5) : value))
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be HH:mm' })
  endTime: string;
}

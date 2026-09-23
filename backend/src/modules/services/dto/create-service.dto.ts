import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Deep tissue massage' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes: number;

  @ApiProperty({ example: 3500, description: 'Price in cents' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents: number;
}

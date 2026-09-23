import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type RegisterRole = 'OWNER' | 'CLIENT';

export class RegisterDto {
  @ApiProperty({ example: 'owner@studio.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Hoxha' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ enum: ['OWNER', 'CLIENT'] })
  @IsIn(['OWNER', 'CLIENT'])
  role: RegisterRole;

  @ApiPropertyOptional({ description: 'Required when role is OWNER' })
  @ValidateIf((dto: RegisterDto) => dto.role === 'OWNER')
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName?: string;

  @ApiPropertyOptional({ description: 'Required when role is CLIENT' })
  @ValidateIf((dto: RegisterDto) => dto.role === 'CLIENT')
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  businessSlug?: string;
}

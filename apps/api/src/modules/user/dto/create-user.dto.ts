import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@avala/db';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: Role, example: 'TRAINEE' })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty({
    example: 'PERJ850101HDFRNN09',
    required: false,
    description: 'Clave Única de Registro de Población (18 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(18, 18)
  @Matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/, {
    message: 'CURP must be a valid 18-character Mexican CURP',
  })
  curp?: string;

  @ApiProperty({
    example: 'PERJ850101ABC',
    required: false,
    description: 'Registro Federal de Contribuyentes (13 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(12, 13)
  rfc?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'juan@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'PERJ850101HDFRNN09', required: false })
  @IsOptional()
  @IsString()
  @Length(18, 18)
  curp?: string;

  @ApiProperty({ example: 'PERJ850101ABC', required: false })
  @IsOptional()
  @IsString()
  @Length(12, 13)
  rfc?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class QueryUsersDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}

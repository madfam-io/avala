import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@avala.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'changeme' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    tenantId: string;
  };

  @ApiProperty()
  tenant: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({ description: 'Access token (also set in HTTP-only cookie)' })
  accessToken: string;
}

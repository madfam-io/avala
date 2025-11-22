import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import { User } from '@avala/db';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   * Validates credentials and returns JWT in cookie + response
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() _loginDto: LoginDto, // Validated by LocalAuthGuard
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // User is already validated and attached by LocalAuthGuard
    const result = await this.authService.login(req.user);

    // Set HTTP-only cookie
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Also set tenantId cookie for convenience
    res.cookie('tenant_id', result.user.tenantId, {
      httpOnly: false, // Client can read this one
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  /**
   * Logout endpoint
   * Clears authentication cookies
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('tenant_id');

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user (me) endpoint
   * Returns authenticated user info
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: User) {
    const fullUser = await this.authService.getCurrentUser(user.id);

    return {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        role: fullUser.role,
        tenantId: fullUser.tenantId,
      },
      tenant: {
        id: fullUser.tenant.id,
        name: fullUser.tenant.name,
        slug: fullUser.tenant.slug,
      },
    };
  }
}

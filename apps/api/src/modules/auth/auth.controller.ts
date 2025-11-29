import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { ThrottlerGuard, Throttle, SkipThrottle } from "@nestjs/throttler";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { JanuaAuthService } from "./janua-auth.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { SsoLoginDto, SsoCallbackDto } from "./dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/tenant.decorator";
import { User } from "@avala/db";
import { AuthenticatedRequest } from "../../common/interfaces";

@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly januaAuthService: JanuaAuthService,
  ) {}

  /**
   * Login endpoint
   * Validates credentials and returns JWT in cookie + response
   * Rate limited: 5 attempts per minute to prevent brute force attacks
   */
  @Post("login")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiTooManyRequestsResponse({
    description: "Too many login attempts. Please try again later.",
  })
  async login(
    @Body() _loginDto: LoginDto, // Validated by LocalAuthGuard
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // User is already validated and attached by LocalAuthGuard
    const result = await this.authService.login(req.user);

    // Set HTTP-only cookie
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Also set tenantId cookie for convenience
    res.cookie("tenant_id", result.user.tenantId, {
      httpOnly: false, // Client can read this one
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  /**
   * SSO Login - Redirect to Janua OAuth
   * Rate limited: 10 attempts per minute
   */
  @Get("sso/login")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: "Initiate SSO login via Janua" })
  @ApiTooManyRequestsResponse({
    description: "Too many SSO login attempts. Please try again later.",
  })
  @ApiQuery({
    name: "tenant",
    required: false,
    description: "Tenant slug for organization login",
  })
  @ApiQuery({
    name: "redirect",
    required: false,
    description: "URL to redirect after login",
  })
  async ssoLogin(
    @Query() query: SsoLoginDto,
    @Res() res: Response,
  ): Promise<void> {
    // Generate state for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        tenantSlug: query.tenantSlug,
        redirectUrl: query.redirectUrl,
        timestamp: Date.now(),
      }),
    ).toString("base64");

    const authUrl = this.januaAuthService.getAuthorizationUrl(
      query.tenantSlug,
      state,
    );
    res.redirect(authUrl);
  }

  /**
   * SSO Callback - Handle Janua OAuth callback
   * Rate limited: 10 attempts per minute
   */
  @Get("sso/callback")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: "Handle SSO callback from Janua" })
  @ApiTooManyRequestsResponse({
    description: "Too many callback attempts. Please try again later.",
  })
  async ssoCallback(
    @Query() query: SsoCallbackDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    // Handle OAuth errors
    if (query.error) {
      throw new BadRequestException(
        `SSO error: ${query.error_description || query.error}`,
      );
    }

    if (!query.code) {
      throw new BadRequestException("Authorization code is required");
    }

    // Parse state to get tenant info
    let tenantId: string | undefined;
    let redirectUrl: string | undefined;

    if (query.state) {
      try {
        const stateData = JSON.parse(
          Buffer.from(query.state, "base64").toString(),
        );
        redirectUrl = stateData.redirectUrl;

        // If tenant slug provided, resolve to tenant ID
        if (stateData.tenantSlug) {
          // For now, we'll need to look up the tenant - this would need the TenantService
          // In a full implementation, inject TenantService and look up by slug
        }
      } catch {
        // Invalid state, continue without it
      }
    }

    // If no tenant specified, use default tenant (for single-tenant setups)
    if (!tenantId) {
      tenantId = process.env.DEFAULT_TENANT_ID || "";
    }

    if (!tenantId) {
      throw new BadRequestException("Tenant ID is required for SSO login");
    }

    // Exchange code for tokens and sync user
    const result = await this.januaAuthService.handleSsoCallback(
      query.code,
      tenantId,
    );

    // Set HTTP-only cookie
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Set tenantId cookie
    res.cookie("tenant_id", result.user.tenantId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Redirect to app or return response
    if (redirectUrl) {
      res.redirect(redirectUrl);
      return;
    }

    return {
      message: "SSO login successful",
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        tenantId: result.user.tenantId,
      },
    };
  }

  /**
   * SSO Logout - Logout from both local and Janua
   */
  @Post("sso/logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout from SSO session" })
  async ssoLogout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Revoke Janua tokens
    await this.januaAuthService.logout(user.id);

    // Clear local cookies
    res.clearCookie("access_token");
    res.clearCookie("tenant_id");

    return { message: "Logged out successfully" };
  }

  /**
   * Refresh SSO tokens
   */
  @Post("sso/refresh")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh SSO tokens" })
  async refreshSsoTokens(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.januaAuthService.refreshTokens(user.id);
    return { message: "Tokens refreshed successfully" };
  }

  /**
   * Logout endpoint
   * Clears authentication cookies
   */
  @Post("logout")
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout and clear cookies" })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token");
    res.clearCookie("tenant_id");

    return { message: "Logged out successfully" };
  }

  /**
   * Get current user (me) endpoint
   * Returns authenticated user info
   */
  @Get("me")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  async getMe(@CurrentUser() user: User) {
    const fullUser = (await this.authService.getCurrentUser(
      user.id,
    )) as User & {
      tenant: { id: string; name: string; slug: string };
    };

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

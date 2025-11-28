import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { JwtService } from "@nestjs/jwt";

interface JanuaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface JanuaUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  updated_at?: number;
}

@Injectable()
export class JanuaAuthService {
  private readonly logger = new Logger(JanuaAuthService.name);
  private readonly januaBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.januaBaseUrl = this.configService.getOrThrow("JANUA_BASE_URL");
    this.clientId = this.configService.getOrThrow("JANUA_CLIENT_ID");
    this.clientSecret = this.configService.getOrThrow("JANUA_CLIENT_SECRET");
    this.redirectUri = this.configService.getOrThrow("JANUA_REDIRECT_URI");
  }

  /**
   * Generate the Janua OAuth authorization URL
   */
  getAuthorizationUrl(tenantSlug?: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "openid profile email",
      ...(state && { state }),
      ...(tenantSlug && { login_hint: tenantSlug }),
    });

    return `${this.januaBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<JanuaTokenResponse> {
    const response = await fetch(`${this.januaBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua token exchange failed: ${error}`);
      throw new UnauthorizedException("Failed to exchange authorization code");
    }

    return response.json() as Promise<JanuaTokenResponse>;
  }

  /**
   * Get user info from Janua using access token
   */
  async getUserInfo(accessToken: string): Promise<JanuaUserInfo> {
    const response = await fetch(`${this.januaBaseUrl}/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua userinfo failed: ${error}`);
      throw new UnauthorizedException("Failed to get user info");
    }

    return response.json() as Promise<JanuaUserInfo>;
  }

  /**
   * Handle SSO callback - sync user and generate local JWT
   */
  async handleSsoCallback(
    code: string,
    tenantId: string,
  ): Promise<{ accessToken: string; user: any }> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Get user info from Janua
    const userInfo = await this.getUserInfo(tokens.access_token);

    // Find or create user in local database
    const user = await this.syncUserFromJanua(userInfo, tenantId);

    // Store Janua tokens for the user
    await this.storeJanuaTokens(user.id, tokens);

    // Generate local JWT
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      januaSub: userInfo.sub,
    });

    return { accessToken, user };
  }

  /**
   * Sync user from Janua to local database
   */
  private async syncUserFromJanua(
    userInfo: JanuaUserInfo,
    tenantId: string,
  ): Promise<any> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { januaSubjectId: userInfo.sub },
          { email: userInfo.email, tenantId },
        ],
      },
    });

    if (existingUser) {
      // Update existing user with latest Janua info
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          januaSubjectId: userInfo.sub,
          email: userInfo.email,
          emailVerified: userInfo.email_verified,
          firstName: userInfo.given_name ?? existingUser.firstName,
          lastName: userInfo.family_name ?? existingUser.lastName,
          avatarUrl: userInfo.picture ?? existingUser.avatarUrl,
          lastLoginAt: new Date(),
        },
      });
    }

    // Create new user
    return this.prisma.user.create({
      data: {
        januaSubjectId: userInfo.sub,
        email: userInfo.email,
        emailVerified: userInfo.email_verified,
        firstName: userInfo.given_name ?? "",
        lastName: userInfo.family_name ?? "",
        avatarUrl: userInfo.picture,
        tenantId,
        role: "TRAINEE",
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Store Janua tokens for refresh flow
   */
  private async storeJanuaTokens(
    userId: string,
    tokens: JanuaTokenResponse,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await this.prisma.userToken.upsert({
      where: { userId_provider: { userId, provider: "janua" } },
      create: {
        userId,
        provider: "janua",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt,
      },
    });
  }

  /**
   * Refresh Janua tokens using refresh token
   */
  async refreshTokens(userId: string): Promise<JanuaTokenResponse> {
    const storedTokens = await this.prisma.userToken.findUnique({
      where: { userId_provider: { userId, provider: "janua" } },
    });

    if (!storedTokens?.refreshToken) {
      throw new UnauthorizedException("No refresh token available");
    }

    const response = await fetch(`${this.januaBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: storedTokens.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua token refresh failed: ${error}`);
      throw new UnauthorizedException("Failed to refresh tokens");
    }

    const tokens = (await response.json()) as JanuaTokenResponse;
    await this.storeJanuaTokens(userId, tokens);

    return tokens;
  }

  /**
   * Logout user from Janua
   */
  async logout(userId: string): Promise<void> {
    const storedTokens = await this.prisma.userToken.findUnique({
      where: { userId_provider: { userId, provider: "janua" } },
    });

    if (storedTokens?.idToken) {
      // Revoke token at Janua
      await fetch(`${this.januaBaseUrl}/oauth/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          token: storedTokens.accessToken,
        }),
      }).catch((err) => {
        this.logger.warn(`Failed to revoke Janua token: ${err.message}`);
      });
    }

    // Delete local tokens
    await this.prisma.userToken
      .delete({
        where: { userId_provider: { userId, provider: "janua" } },
      })
      .catch(() => {
        // Token may not exist
      });
  }

  /**
   * Validate Janua JWT token
   */
  async validateJanuaToken(token: string): Promise<JanuaUserInfo | null> {
    try {
      const response = await fetch(`${this.januaBaseUrl}/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return response.json() as Promise<JanuaUserInfo>;
    } catch {
      return null;
    }
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JanuaAuthService } from "./janua-auth.service";
import { AuthenticatedRequest } from "../../common/interfaces";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let januaAuthService: jest.Mocked<JanuaAuthService>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "TRAINEE",
    tenantId: "tenant-1",
  };

  const mockLoginResponse = {
    accessToken: "jwt-token",
    user: mockUser,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    const mockJanuaAuthService = {
      getAuthorizationUrl: jest.fn(),
      handleSsoCallback: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JanuaAuthService, useValue: mockJanuaAuthService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    januaAuthService = module.get(JanuaAuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should login user and set cookies", async () => {
      authService.login.mockResolvedValue(mockLoginResponse as any);

      const mockReq = {
        user: mockUser,
      } as unknown as AuthenticatedRequest;
      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.login(
        { email: "test@example.com", password: "password" },
        mockReq,
        mockRes as any,
      );

      expect(result.accessToken).toBe("jwt-token");
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "access_token",
        "jwt-token",
        expect.any(Object),
      );
    });
  });

  describe("ssoLogin", () => {
    it("should redirect to Janua auth URL", async () => {
      januaAuthService.getAuthorizationUrl.mockReturnValue(
        "https://janua.test/oauth/authorize?...",
      );

      const mockRes = {
        redirect: jest.fn(),
      };

      await controller.ssoLogin({ tenantSlug: "test-tenant" }, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining("janua"),
      );
    });
  });

  describe("ssoCallback", () => {
    it("should handle OAuth callback", async () => {
      process.env.DEFAULT_TENANT_ID = "tenant-1";
      januaAuthService.handleSsoCallback.mockResolvedValue(
        mockLoginResponse as any,
      );

      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.ssoCallback(
        { code: "auth-code" },
        mockRes as any,
      );

      expect(result.message).toBe("SSO login successful");
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it("should throw BadRequestException on OAuth error", async () => {
      const mockRes = { cookie: jest.fn() };

      await expect(
        controller.ssoCallback(
          {
            code: "",
            error: "access_denied",
            error_description: "User denied",
          } as any,
          mockRes as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("ssoLogout", () => {
    it("should logout and clear cookies", async () => {
      januaAuthService.logout.mockResolvedValue(undefined);

      const mockRes = {
        clearCookie: jest.fn(),
      };

      const result = await controller.ssoLogout(
        mockUser as any,
        mockRes as any,
      );

      expect(result.message).toBe("Logged out successfully");
      expect(januaAuthService.logout).toHaveBeenCalledWith("user-1");
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe("refreshSsoTokens", () => {
    it("should refresh tokens", async () => {
      januaAuthService.refreshTokens.mockResolvedValue({} as any);

      const result = await controller.refreshSsoTokens(mockUser as any);

      expect(result.message).toBe("Tokens refreshed successfully");
      expect(januaAuthService.refreshTokens).toHaveBeenCalledWith("user-1");
    });
  });

  describe("logout", () => {
    it("should clear cookies", async () => {
      const mockRes = {
        clearCookie: jest.fn(),
      };

      const result = await controller.logout(mockRes as any);

      expect(result.message).toBe("Logged out successfully");
      expect(mockRes.clearCookie).toHaveBeenCalledWith("access_token");
      expect(mockRes.clearCookie).toHaveBeenCalledWith("tenant_id");
    });
  });

  describe("getMe", () => {
    it("should return current user", async () => {
      authService.getCurrentUser.mockResolvedValue({
        ...mockUser,
        tenant: { id: "tenant-1", name: "Test Tenant", slug: "test-tenant" },
      } as any);

      const result = await controller.getMe(mockUser as any);

      expect(result.user.id).toBe("user-1");
      expect(result.tenant.name).toBe("Test Tenant");
    });
  });
});

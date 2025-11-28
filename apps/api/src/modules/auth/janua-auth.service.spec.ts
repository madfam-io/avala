import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JanuaAuthService } from "./janua-auth.service";
import { PrismaService } from "../../database/prisma.service";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("JanuaAuthService", () => {
  let service: JanuaAuthService;
  let mockPrismaService: any;

  const mockConfig = {
    JANUA_BASE_URL: "https://janua.test",
    JANUA_CLIENT_ID: "test-client-id",
    JANUA_CLIENT_SECRET: "test-client-secret",
    JANUA_REDIRECT_URI: "https://app.test/callback",
  };

  const mockTokenResponse = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
    id_token: "test-id-token",
  };

  const mockUserInfo = {
    sub: "janua-user-123",
    email: "test@example.com",
    email_verified: true,
    given_name: "Test",
    family_name: "User",
    picture: "https://example.com/avatar.jpg",
  };

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    tenantId: "tenant-1",
    role: "TRAINEE",
    januaSubjectId: "janua-user-123",
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userToken: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JanuaAuthService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("local-jwt-token"),
          },
        },
      ],
    }).compile();

    service = module.get<JanuaAuthService>(JanuaAuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAuthorizationUrl", () => {
    it("should generate authorization URL", () => {
      const url = service.getAuthorizationUrl();

      expect(url).toContain("https://janua.test/oauth/authorize");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("response_type=code");
      expect(url).toContain("scope=openid");
    });

    it("should include state if provided", () => {
      const url = service.getAuthorizationUrl(undefined, "test-state");

      expect(url).toContain("state=test-state");
    });

    it("should include login_hint if tenant provided", () => {
      const url = service.getAuthorizationUrl("my-tenant");

      expect(url).toContain("login_hint=my-tenant");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange code for tokens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await service.exchangeCodeForTokens("auth-code");

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://janua.test/oauth/token",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should throw UnauthorizedException on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Invalid code"),
      });

      await expect(service.exchangeCodeForTokens("invalid")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("getUserInfo", () => {
    it("should get user info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await service.getUserInfo("access-token");

      expect(result).toEqual(mockUserInfo);
    });

    it("should throw UnauthorizedException on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Invalid token"),
      });

      await expect(service.getUserInfo("invalid")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("handleSsoCallback", () => {
    it("should handle SSO callback for existing user", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserInfo),
        });

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrismaService.user.update.mockResolvedValue(mockUser as any);
      mockPrismaService.userToken.upsert.mockResolvedValue({} as any);

      const result = await service.handleSsoCallback("auth-code", "tenant-1");

      expect(result.accessToken).toBe("local-jwt-token");
      expect(result.user).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it("should create new user if not exists", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserInfo),
        });

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser as any);
      mockPrismaService.userToken.upsert.mockResolvedValue({} as any);

      const result = await service.handleSsoCallback("auth-code", "tenant-1");

      expect(result.accessToken).toBe("local-jwt-token");
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe("refreshTokens", () => {
    it("should refresh tokens", async () => {
      mockPrismaService.userToken.findUnique.mockResolvedValue({
        refreshToken: "old-refresh-token",
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      mockPrismaService.userToken.upsert.mockResolvedValue({} as any);

      const result = await service.refreshTokens("user-1");

      expect(result).toEqual(mockTokenResponse);
    });

    it("should throw if no refresh token available", async () => {
      mockPrismaService.userToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens("user-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    it("should revoke token and delete local tokens", async () => {
      mockPrismaService.userToken.findUnique.mockResolvedValue({
        idToken: "id-token",
        accessToken: "access-token",
      } as any);

      mockFetch.mockResolvedValueOnce({ ok: true });
      mockPrismaService.userToken.delete.mockResolvedValue({} as any);

      await service.logout("user-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://janua.test/oauth/revoke",
        expect.any(Object),
      );
      expect(mockPrismaService.userToken.delete).toHaveBeenCalled();
    });
  });

  describe("validateJanuaToken", () => {
    it("should validate token and return user info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await service.validateJanuaToken("valid-token");

      expect(result).toEqual(mockUserInfo);
    });

    it("should return null for invalid token", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await service.validateJanuaToken("invalid-token");

      expect(result).toBeNull();
    });
  });
});

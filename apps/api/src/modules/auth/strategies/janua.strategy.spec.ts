import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JanuaStrategy } from "./janua.strategy";
import { PrismaService } from "../../../database/prisma.service";

describe("JanuaStrategy", () => {
  let strategy: JanuaStrategy;
  let prisma: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue("test-secret"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JanuaStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JanuaStrategy>(JanuaStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    const mockPayload = {
      sub: "user-1",
      email: "test@example.com",
      tenantId: "tenant-1",
      role: "student",
      januaSub: "janua-123",
      iat: Date.now(),
      exp: Date.now() + 3600000,
    };

    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      role: "STUDENT",
      tenantId: "tenant-1",
      tenant: {
        id: "tenant-1",
        slug: "test-tenant",
        name: "Test Tenant",
        status: "ACTIVE",
        plan: "PROFESSIONAL",
      },
    };

    it("should return user data when payload is valid", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              plan: true,
            },
          },
        },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
        tenant: mockUser.tenant,
        januaSub: mockPayload.januaSub,
      });
    });

    it("should throw UnauthorizedException when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw UnauthorizedException when tenant is inactive", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: { ...mockUser.tenant, status: "INACTIVE" },
      });

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        "Tenant is inactive"
      );
    });

    it("should throw UnauthorizedException when tenant is null", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: null,
      });

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});

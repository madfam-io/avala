import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { PrismaService } from "../../database/prisma.service";
import { Plan } from "@avala/db";
import { TenantPlan } from "./dto/create-tenant.dto";
import { TenantStatus } from "./dto/update-tenant.dto";

describe("TenantService", () => {
  let service: TenantService;

  const mockTenantId = "tenant-123";

  const mockTenant = {
    id: mockTenantId,
    name: "Test Tenant",
    slug: "test-tenant",
    plan: "PROFESSIONAL" as Plan,
    status: "ACTIVE",
    settings: { theme: "dark" },
    rfc: "RFC123456",
    legalName: "Test Tenant S.A. de C.V.",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { users: 10, courses: 5 },
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    course: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
    },
    userAchievement: {
      deleteMany: jest.fn(),
    },
    userStreak: {
      deleteMany: jest.fn(),
    },
    quizAttempt: {
      deleteMany: jest.fn(),
    },
    lessonProgress: {
      deleteMany: jest.fn(),
    },
    courseEnrollment: {
      deleteMany: jest.fn(),
    },
    userToken: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  describe("findById", () => {
    it("should return tenant by ID", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById(mockTenantId);

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        include: {
          _count: {
            select: { users: true, courses: true },
          },
        },
      });
    });

    it("should throw NotFoundException if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findBySlug", () => {
    it("should return tenant by slug", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug("test-tenant");

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-tenant" },
        include: {
          _count: {
            select: { users: true, courses: true },
          },
        },
      });
    });

    it("should throw NotFoundException if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated tenants", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: [mockTenant],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it("should filter by search query", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);

      await service.findAll({ search: "test" });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { slug: { contains: "test", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("should filter by status", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);

      await service.findAll({ status: TenantStatus.ACTIVE });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: TenantStatus.ACTIVE },
        }),
      );
    });

    it("should filter by plan", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);

      await service.findAll({ plan: TenantPlan.PROFESSIONAL });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { plan: TenantPlan.PROFESSIONAL },
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([]);
      mockPrisma.tenant.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe("create", () => {
    const createDto = {
      name: "New Tenant",
      slug: "new-tenant",
      adminEmail: "admin@new.com",
      adminFirstName: "Admin",
      adminLastName: "User",
      plan: TenantPlan.BASIC,
    };

    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      mockPrisma.user.create.mockResolvedValue({});
    });

    it("should create a new tenant with admin user", async () => {
      const result = await service.create(createDto);

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.create).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it("should throw ConflictException if slug already exists", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if admin email already exists", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: "existing-user" });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should default to BASIC plan if not specified", async () => {
      const { plan: _plan, ...dtoWithoutPlan } = createDto;
      await service.create(dtoWithoutPlan);

      expect(mockPrisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan: "BASIC",
          }),
        }),
      );
    });
  });

  describe("update", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        name: "Updated",
      });
    });

    it("should update tenant", async () => {
      const result = await service.update(mockTenantId, { name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: { name: "Updated" },
        include: {
          _count: {
            select: { users: true, courses: true },
          },
        },
      });
    });

    it("should throw NotFoundException if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, { name: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateSettings", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        settings: { theme: "dark", newSetting: "value" },
      });
    });

    it("should merge settings", async () => {
      await service.updateSettings(mockTenantId, {
        newSetting: "value",
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          settings: { theme: "dark", newSetting: "value" },
        },
      });
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: "CANCELLED",
      });
    });

    it("should soft delete tenant by setting status to CANCELLED", async () => {
      const result = await service.delete(mockTenantId);

      expect(result.status).toBe("CANCELLED");
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: { status: "CANCELLED" },
      });
    });
  });

  describe("hardDelete", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        status: "CANCELLED",
      });
      mockPrisma.user.findMany.mockResolvedValue([{ id: "user-1" }]);
    });

    it("should hard delete tenant and all associated data", async () => {
      await service.hardDelete(mockTenantId);

      expect(mockPrisma.userAchievement.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.userStreak.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.user.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.course.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.tenant.delete).toHaveBeenCalled();
    });

    it("should throw BadRequestException if tenant is not cancelled", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant); // ACTIVE status

      await expect(service.hardDelete(mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("suspend", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: "SUSPENDED",
      });
    });

    it("should suspend tenant with reason", async () => {
      const result = await service.suspend(mockTenantId, "Payment failed");

      expect(result.status).toBe("SUSPENDED");
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          status: "SUSPENDED",
          settings: expect.objectContaining({
            suspendedReason: "Payment failed",
          }),
        },
      });
    });

    it("should throw BadRequestException if already suspended", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        status: "SUSPENDED",
      });

      await expect(service.suspend(mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("reactivate", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        status: "SUSPENDED",
        settings: { suspendedAt: "2024-01-01", suspendedReason: "Payment" },
      });
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: "ACTIVE",
      });
    });

    it("should reactivate suspended tenant", async () => {
      const result = await service.reactivate(mockTenantId);

      expect(result.status).toBe("ACTIVE");
    });

    it("should remove suspended settings", async () => {
      await service.reactivate(mockTenantId);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          status: "ACTIVE",
          settings: {},
        },
      });
    });

    it("should throw BadRequestException if not suspended", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.reactivate(mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getStats", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.course.count.mockResolvedValue(5);
      mockPrisma.enrollment.count.mockResolvedValue(50);
      mockPrisma.certificate.count.mockResolvedValue(20);
    });

    it("should return tenant statistics", async () => {
      const result = await service.getStats(mockTenantId);

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 10,
        totalCourses: 5,
        totalEnrollments: 50,
        completedEnrollments: 50,
        totalCertificates: 20,
      });
    });
  });

  describe("checkPlanLimits", () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.course.count.mockResolvedValue(5);
      mockPrisma.enrollment.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
    });

    it("should return within limits for professional plan", async () => {
      const result = await service.checkPlanLimits(mockTenantId);

      expect(result.withinLimits).toBe(true);
      expect(result.limits.maxUsers).toBe(500);
      expect(result.limits.currentUsers).toBe(10);
    });

    it("should return not within limits when exceeded", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        plan: "FREE",
      });
      mockPrisma.user.count.mockResolvedValue(15);

      const result = await service.checkPlanLimits(mockTenantId);

      expect(result.withinLimits).toBe(false);
    });

    it("should return unlimited for enterprise plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        plan: "ENTERPRISE",
      });

      const result = await service.checkPlanLimits(mockTenantId);

      expect(result.limits.maxUsers).toBe("Unlimited");
      expect(result.limits.maxCourses).toBe("Unlimited");
    });
  });
});

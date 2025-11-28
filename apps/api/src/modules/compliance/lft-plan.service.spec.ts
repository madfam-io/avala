import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { LFTPlanService } from "./lft-plan.service";
import { PrismaService } from "../../database/prisma.service";
import { TrainingProgramType, TrainingModality } from "./dto/lft-plan.dto";

describe("LFTPlanService", () => {
  let service: LFTPlanService;
  let mockPrismaService: any;

  const mockTenantId = "tenant-1";
  const mockPlanId = "plan-1";

  const mockProgram = {
    nombre: "Capacitación en Seguridad",
    tipo: TrainingProgramType.INDUCTION,
    modalidad: TrainingModality.PRESENCIAL,
    objetivo: "Capacitar en seguridad laboral",
    areasObjetivo: ["Producción", "Almacén"],
    puestosObjetivo: ["Operador", "Supervisor"],
    mesInicio: 1,
    mesFin: 3,
    duracionHoras: 40,
    participantesEstimados: 50,
  };

  const mockPlan = {
    id: mockPlanId,
    tenantId: mockTenantId,
    year: 2024,
    businessUnit: "Headquarters",
    programJson: [mockProgram],
    lockedAt: null,
    createdAt: new Date(),
    tenant: { name: "Test Tenant", slug: "test-tenant" },
  };

  const mockTenant = {
    id: mockTenantId,
    name: "Test Tenant",
    slug: "test-tenant",
  };

  beforeEach(async () => {
    const mockPrisma = {
      tenant: {
        findUnique: jest.fn(),
      },
      lFTPlan: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      dC3: {
        findMany: jest.fn(),
      },
    };

    mockPrismaService = mockPrisma;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LFTPlanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LFTPlanService>(LFTPlanService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new LFT plan", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockPrismaService.lFTPlan.findFirst.mockResolvedValue(null);
      mockPrismaService.lFTPlan.create.mockResolvedValue(mockPlan as any);

      const result = await service.create({
        tenantId: mockTenantId,
        year: 2024,
        businessUnit: "Headquarters",
        programs: [mockProgram],
      });

      expect(result.id).toBe(mockPlanId);
      expect(result.programs).toHaveLength(1);
    });

    it("should throw NotFoundException if tenant not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          tenantId: "invalid",
          year: 2024,
          businessUnit: "HQ",
          programs: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if plan exists", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockPrismaService.lFTPlan.findFirst.mockResolvedValue(mockPlan as any);

      await expect(
        service.create({
          tenantId: mockTenantId,
          year: 2024,
          businessUnit: "Headquarters",
          programs: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("should validate program dates", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockPrismaService.lFTPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          tenantId: mockTenantId,
          year: 2024,
          businessUnit: "HQ",
          programs: [{ ...mockProgram, mesInicio: 12, mesFin: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findById", () => {
    it("should return plan by id", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);

      const result = await service.findById(mockPlanId);

      expect(result.id).toBe(mockPlanId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(null);

      await expect(service.findById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated plans", async () => {
      mockPrismaService.lFTPlan.findMany.mockResolvedValue([mockPlan] as any);
      mockPrismaService.lFTPlan.count.mockResolvedValue(1);

      const result = await service.findAll({ tenantId: mockTenantId });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by year", async () => {
      mockPrismaService.lFTPlan.findMany.mockResolvedValue([]);
      mockPrismaService.lFTPlan.count.mockResolvedValue(0);

      await service.findAll({ year: 2024 });

      expect(mockPrismaService.lFTPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ year: 2024 }),
        }),
      );
    });
  });

  describe("update", () => {
    it("should update plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.update.mockResolvedValue({
        ...mockPlan,
        businessUnit: "Updated",
      } as any);

      const result = await service.update(mockPlanId, {
        businessUnit: "Updated",
      });

      expect(result.businessUnit).toBe("Updated");
    });

    it("should throw BadRequestException if plan is locked", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue({
        ...mockPlan,
        lockedAt: new Date(),
      } as any);

      await expect(
        service.update(mockPlanId, { businessUnit: "New" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("should delete plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.delete.mockResolvedValue(mockPlan as any);

      const result = await service.delete(mockPlanId);

      expect(result.success).toBe(true);
    });

    it("should throw BadRequestException if plan is locked", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue({
        ...mockPlan,
        lockedAt: new Date(),
      } as any);

      await expect(service.delete(mockPlanId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("setLock", () => {
    it("should lock plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.update.mockResolvedValue({
        ...mockPlan,
        lockedAt: new Date(),
      } as any);

      const result = await service.setLock(mockPlanId, true);

      expect(result.isLocked).toBe(true);
    });

    it("should unlock plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue({
        ...mockPlan,
        lockedAt: new Date(),
      } as any);
      mockPrismaService.lFTPlan.update.mockResolvedValue(mockPlan as any);

      const result = await service.setLock(mockPlanId, false);

      expect(result.isLocked).toBe(false);
    });
  });

  describe("addProgram", () => {
    it("should add program to plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.update.mockResolvedValue({
        ...mockPlan,
        programJson: [mockProgram, mockProgram],
      } as any);

      const result = await service.addProgram(mockPlanId, mockProgram);

      expect(result.programs).toHaveLength(2);
    });

    it("should throw BadRequestException if locked", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue({
        ...mockPlan,
        lockedAt: new Date(),
      } as any);

      await expect(service.addProgram(mockPlanId, mockProgram)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("removeProgram", () => {
    it("should remove program from plan", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.update.mockResolvedValue({
        ...mockPlan,
        programJson: [],
      } as any);

      const result = await service.removeProgram(mockPlanId, 0);

      expect(result.programs).toHaveLength(0);
    });

    it("should throw BadRequestException for invalid index", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);

      await expect(service.removeProgram(mockPlanId, 99)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getSummary", () => {
    it("should return summary statistics", async () => {
      mockPrismaService.lFTPlan.findMany.mockResolvedValue([mockPlan] as any);

      const result = await service.getSummary(mockTenantId, 2024);

      expect(result.totalPlans).toBe(1);
      expect(result.totalPrograms).toBe(1);
      expect(result.totalHours).toBe(40);
    });
  });

  describe("cloneToYear", () => {
    it("should clone plan to new year", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.findFirst.mockResolvedValue(null);
      mockPrismaService.lFTPlan.create.mockResolvedValue({
        ...mockPlan,
        id: "new-plan",
        year: 2025,
      } as any);

      const result = await service.cloneToYear(mockPlanId, 2025);

      expect(result.year).toBe(2025);
    });

    it("should throw ConflictException if plan exists in target year", async () => {
      mockPrismaService.lFTPlan.findUnique.mockResolvedValue(mockPlan as any);
      mockPrismaService.lFTPlan.findFirst.mockResolvedValue({
        ...mockPlan,
        year: 2025,
      } as any);

      await expect(service.cloneToYear(mockPlanId, 2025)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("getYearOverview", () => {
    it("should return year overview with progress", async () => {
      mockPrismaService.lFTPlan.findMany.mockResolvedValue([mockPlan] as any);
      mockPrismaService.dC3.findMany.mockResolvedValue([]);

      const result = await service.getYearOverview(mockTenantId, 2024);

      expect(result.year).toBe(2024);
      expect(result.plans).toHaveLength(1);
      expect(result.summary).toBeDefined();
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { EnrollmentManagementService } from "./enrollment-management.service";
import { PrismaService } from "../../../database/prisma.service";

describe("EnrollmentManagementService", () => {
  let service: EnrollmentManagementService;
  let mockPrismaService: any;

  const mockUserId = "user-1";
  const mockECCode = "EC0249";
  const mockEnrollmentId = "enrollment-1";
  const mockTenantId = "tenant-1";

  const mockEC = {
    id: "ec-1",
    code: mockECCode,
    title: "Test EC Standard",
    status: "PUBLISHED",
    description: "Test description",
    estimatedHours: 40,
    modules: [
      {
        id: "module-1",
        lessons: [{ id: "lesson-1" }, { id: "lesson-2" }],
      },
    ],
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: mockUserId,
    ecId: "ec-1",
    tenantId: mockTenantId,
    status: "IN_PROGRESS",
    overallProgress: 50,
    enrolledAt: new Date(),
    ec: mockEC,
    moduleProgress: [],
    lessonProgress: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCStandard: {
        findUnique: jest.fn(),
      },
      eCEnrollment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      eCModuleProgress: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
      },
      eCLessonProgress: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentManagementService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EnrollmentManagementService>(
      EnrollmentManagementService,
    );
    mockPrismaService = mockPrisma;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("enrollUser", () => {
    it("should enroll user in EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findUnique
        .mockResolvedValueOnce(null) // First call: check existing enrollment
        .mockResolvedValueOnce(mockEnrollment as any); // Second call: findEnrollmentById
      mockPrismaService.eCEnrollment.create.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCModuleProgress.createMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.eCLessonProgress.createMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.enrollUser({
        userId: mockUserId,
        ecCode: mockECCode,
        tenantId: mockTenantId,
      });

      expect(result.id).toBe(mockEnrollmentId);
      expect(mockPrismaService.eCEnrollment.create).toHaveBeenCalled();
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.enrollUser({
          userId: mockUserId,
          ecCode: "INVALID",
          tenantId: mockTenantId,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if EC not published", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue({
        ...mockEC,
        status: "DRAFT",
      } as any);

      await expect(
        service.enrollUser({
          userId: mockUserId,
          ecCode: mockECCode,
          tenantId: mockTenantId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if already enrolled", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      await expect(
        service.enrollUser({
          userId: mockUserId,
          ecCode: mockECCode,
          tenantId: mockTenantId,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAllEnrollments", () => {
    it("should return paginated enrollments", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ] as any);
      mockPrismaService.eCEnrollment.count.mockResolvedValue(1);

      const result = await service.findAllEnrollments({ ecCode: mockECCode });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by status", async () => {
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([]);
      mockPrismaService.eCEnrollment.count.mockResolvedValue(0);

      await service.findAllEnrollments({ status: "COMPLETED" });

      expect(mockPrismaService.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "COMPLETED" }),
        }),
      );
    });
  });

  describe("findUserEnrollments", () => {
    it("should return user enrollments", async () => {
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ] as any);

      const result = await service.findUserEnrollments(mockUserId, {});

      expect(result).toHaveLength(1);
    });

    it("should filter by status", async () => {
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([]);

      await service.findUserEnrollments(mockUserId, { status: "IN_PROGRESS" });

      expect(mockPrismaService.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            status: "IN_PROGRESS",
          }),
        }),
      );
    });

    it("should include progress when requested", async () => {
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ] as any);

      await service.findUserEnrollments(mockUserId, { includeProgress: true });

      expect(mockPrismaService.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            moduleProgress: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("findEnrollmentById", () => {
    it("should return enrollment by id", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      const result = await service.findEnrollmentById(mockEnrollmentId);

      expect(result.id).toBe(mockEnrollmentId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.findEnrollmentById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findEnrollmentByUserAndEC", () => {
    it("should return enrollment by user and EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      const result = await service.findEnrollmentByUserAndEC(
        mockUserId,
        mockECCode,
      );

      expect(result.id).toBe(mockEnrollmentId);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.findEnrollmentByUserAndEC(mockUserId, "INVALID"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if not enrolled", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.findEnrollmentByUserAndEC(mockUserId, mockECCode),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("withdrawEnrollment", () => {
    it("should withdraw enrollment", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCEnrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: "EXPIRED",
      } as any);

      const result = await service.withdrawEnrollment(mockEnrollmentId);

      expect(result.message).toContain("withdrawn");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.withdrawEnrollment("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if certified", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        status: "CERTIFIED",
      } as any);

      await expect(
        service.withdrawEnrollment(mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("resetEnrollmentProgress", () => {
    it("should reset progress", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCModuleProgress.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.eCLessonProgress.updateMany.mockResolvedValue({
        count: 2,
      });
      mockPrismaService.eCEnrollment.update.mockResolvedValue({
        ...mockEnrollment,
        overallProgress: 0,
      } as any);

      const result = await service.resetEnrollmentProgress(mockEnrollmentId);

      expect(result.message).toContain("reset");
    });

    it("should throw BadRequestException if certified", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        status: "CERTIFIED",
      } as any);

      await expect(
        service.resetEnrollmentProgress(mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

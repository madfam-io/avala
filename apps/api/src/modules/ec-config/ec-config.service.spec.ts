import { Test, TestingModule } from "@nestjs/testing";
import { ECConfigService } from "./ec-config.service";
import { PrismaService } from "../../database/prisma.service";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("ECConfigService", () => {
  let service: ECConfigService;

  const mockECId = "ec-123";
  const mockElementId = "element-123";
  const mockModuleId = "module-123";
  const mockLessonId = "lesson-123";

  const mockStandard = {
    id: mockECId,
    code: "EC0249",
    version: "01",
    title: "Test EC Standard",
    status: "DRAFT",
    elements: [],
    modules: [],
    templates: [],
    assessments: [],
    simulations: [],
    _count: {
      elements: 0,
      modules: 0,
      templates: 0,
      assessments: 0,
      simulations: 0,
      enrollments: 0,
    },
  };

  const mockElement = {
    id: mockElementId,
    ecId: mockECId,
    code: "E0875",
    title: "Test Element",
    orderIndex: 0,
  };

  const mockModule = {
    id: mockModuleId,
    ecId: mockECId,
    code: "M001",
    title: "Test Module",
    orderIndex: 0,
    lessons: [],
    _count: { lessons: 0, assessments: 0, progress: 0 },
  };

  const mockLesson = {
    id: mockLessonId,
    moduleId: mockModuleId,
    code: "L001",
    title: "Test Lesson",
    orderIndex: 0,
    _count: { progress: 0 },
  };

  const mockPrismaService = {
    eCStandard: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    eCElement: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eCModule: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eCModuleElement: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    eCLesson: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECConfigService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ECConfigService>(ECConfigService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createStandard", () => {
    it("should create EC standard", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);
      mockPrismaService.eCStandard.create.mockResolvedValue(mockStandard);

      const result = await service.createStandard({
        code: "EC0249",
        title: "Test EC Standard",
        description: "Test EC standard description",
      });

      expect(result).toEqual(mockStandard);
    });

    it("should throw ConflictException if code exists", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);

      await expect(
        service.createStandard({
          code: "EC0249",
          title: "Test",
          description: "Desc",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAllStandards", () => {
    it("should return paginated standards", async () => {
      mockPrismaService.eCStandard.findMany.mockResolvedValue([mockStandard]);
      mockPrismaService.eCStandard.count.mockResolvedValue(1);

      const result = await service.findAllStandards({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by status", async () => {
      mockPrismaService.eCStandard.findMany.mockResolvedValue([]);
      mockPrismaService.eCStandard.count.mockResolvedValue(0);

      await service.findAllStandards({ status: "PUBLISHED" });

      expect(mockPrismaService.eCStandard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PUBLISHED" }),
        }),
      );
    });
  });

  describe("findStandardByCode", () => {
    it("should return standard by code", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);

      const result = await service.findStandardByCode("EC0249");

      expect(result).toEqual(mockStandard);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(service.findStandardByCode("INVALID")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateStandard", () => {
    it("should update standard", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCStandard.update.mockResolvedValue({
        ...mockStandard,
        title: "Updated",
      });

      const result = await service.updateStandard("EC0249", {
        title: "Updated",
      });

      expect(result.title).toBe("Updated");
    });

    it("should set publishedAt when publishing", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCStandard.update.mockResolvedValue({
        ...mockStandard,
        status: "PUBLISHED",
      });

      await service.updateStandard("EC0249", { status: "PUBLISHED" });

      expect(mockPrismaService.eCStandard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PUBLISHED",
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("deleteStandard", () => {
    it("should delete standard without enrollments", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue({
        ...mockStandard,
        _count: { enrollments: 0 },
      });
      mockPrismaService.eCStandard.delete.mockResolvedValue({});

      const result = await service.deleteStandard("EC0249");

      expect(result.message).toContain("deleted");
    });

    it("should throw ConflictException if has enrollments", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue({
        ...mockStandard,
        _count: { enrollments: 5 },
      });

      await expect(service.deleteStandard("EC0249")).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("createElement", () => {
    it("should create element", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCElement.findFirst.mockResolvedValue(null);
      mockPrismaService.eCElement.create.mockResolvedValue(mockElement);

      const result = await service.createElement("EC0249", {
        code: "E0875",
        title: "Test Element",
        description: "Test element description",
      });

      expect(result).toEqual(mockElement);
    });

    it("should throw ConflictException if code exists", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCElement.findFirst.mockResolvedValue(mockElement);

      await expect(
        service.createElement("EC0249", {
          code: "E0875",
          title: "Test",
          description: "Desc",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("createModule", () => {
    it("should create module", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCModule.findFirst.mockResolvedValue(null);
      mockPrismaService.eCModule.create.mockResolvedValue(mockModule);
      mockPrismaService.eCModule.findUnique.mockResolvedValue(mockModule);

      const result = await service.createModule("EC0249", {
        code: "M001",
        title: "Test Module",
      });

      expect(result).toEqual(mockModule);
    });

    it("should link elements if provided", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockStandard);
      mockPrismaService.eCModule.findFirst.mockResolvedValue(null);
      mockPrismaService.eCModule.create.mockResolvedValue(mockModule);
      mockPrismaService.eCModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.eCModuleElement.createMany.mockResolvedValue({
        count: 1,
      });

      await service.createModule("EC0249", {
        code: "M001",
        title: "Test Module",
        elementIds: [mockElementId],
      });

      expect(mockPrismaService.eCModuleElement.createMany).toHaveBeenCalled();
    });
  });

  describe("createLesson", () => {
    it("should create lesson", async () => {
      mockPrismaService.eCModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.eCLesson.findFirst.mockResolvedValue(null);
      mockPrismaService.eCLesson.create.mockResolvedValue(mockLesson);

      const result = await service.createLesson(mockModuleId, {
        code: "L001",
        title: "Test Lesson",
      });

      expect(result).toEqual(mockLesson);
    });

    it("should throw ConflictException if code exists", async () => {
      mockPrismaService.eCModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.eCLesson.findFirst.mockResolvedValue(mockLesson);

      await expect(
        service.createLesson(mockModuleId, { code: "L001", title: "Test" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("deleteModule", () => {
    it("should delete module without progress", async () => {
      mockPrismaService.eCModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.eCModule.delete.mockResolvedValue({});

      const result = await service.deleteModule(mockModuleId);

      expect(result.message).toContain("deleted");
    });

    it("should throw ConflictException if has progress", async () => {
      mockPrismaService.eCModule.findUnique.mockResolvedValue({
        ...mockModule,
        _count: { progress: 5 },
      });

      await expect(service.deleteModule(mockModuleId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("getStandardOverview", () => {
    it("should return overview with totals", async () => {
      const standardWithModules = {
        ...mockStandard,
        elements: [mockElement],
        modules: [
          { ...mockModule, lessons: [mockLesson], estimatedMinutes: 60 },
        ],
        templates: [],
        assessments: [],
        simulations: [],
      };
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(
        standardWithModules,
      );

      const result = await service.getStandardOverview("EC0249");

      expect(result.overview.totalElements).toBe(1);
      expect(result.overview.totalModules).toBe(1);
      expect(result.overview.totalLessons).toBe(1);
    });
  });

  describe("cloneStandard", () => {
    it("should clone standard with elements and modules", async () => {
      const sourceStandard = {
        ...mockStandard,
        elements: [mockElement],
        modules: [{ ...mockModule, lessons: [mockLesson] }],
      };
      mockPrismaService.eCStandard.findUnique
        .mockResolvedValueOnce(sourceStandard)
        .mockResolvedValueOnce({ ...mockStandard, code: "EC0250" });
      mockPrismaService.eCStandard.create.mockResolvedValue({
        ...mockStandard,
        id: "new-ec",
        code: "EC0250",
      });
      mockPrismaService.eCElement.create.mockResolvedValue({
        ...mockElement,
        id: "new-element",
      });
      mockPrismaService.eCModule.create.mockResolvedValue({
        ...mockModule,
        id: "new-module",
      });
      mockPrismaService.eCLesson.create.mockResolvedValue(mockLesson);

      await service.cloneStandard("EC0249", "EC0250", "Cloned EC");

      expect(mockPrismaService.eCStandard.create).toHaveBeenCalled();
      expect(mockPrismaService.eCElement.create).toHaveBeenCalled();
      expect(mockPrismaService.eCModule.create).toHaveBeenCalled();
    });
  });
});

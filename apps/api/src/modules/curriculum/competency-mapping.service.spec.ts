import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { CompetencyMappingService } from "./competency-mapping.service";
import { PrismaService } from "../../database/prisma.service";

describe("CompetencyMappingService", () => {
  let service: CompetencyMappingService;
  let mockPrismaService: any;

  const mockTenantId = "tenant-1";
  const mockCourseId = "course-1";
  const mockLessonId = "lesson-1";
  const mockCriterionId = "criterion-1";

  const mockCourse = {
    id: mockCourseId,
    title: "Test Course",
    standards: [
      {
        id: "standard-1",
        code: "EC0249",
        title: "Test Standard",
        elements: [
          {
            id: "element-1",
            index: 1,
            title: "Element 1",
            criteria: [
              {
                id: mockCriterionId,
                type: "DESEMPEÑO",
                code: "C1",
                text: "Criterion text",
              },
            ],
          },
        ],
      },
    ],
  };

  const mockLesson = {
    id: mockLessonId,
    title: "Test Lesson",
    criteria: [
      {
        criterion: {
          id: mockCriterionId,
          code: "C1",
          text: "Criterion text",
          type: "DESEMPEÑO",
          element: {
            id: "element-1",
            title: "Element 1",
            standard: {
              id: "standard-1",
              code: "EC0249",
            },
          },
        },
      },
    ],
  };

  const mockCriterion = {
    id: mockCriterionId,
    code: "C1",
    text: "Criterion text",
  };

  const mockLessonCriterion = {
    id: "lc-1",
    lessonId: mockLessonId,
    criterionId: mockCriterionId,
  };

  beforeEach(async () => {
    const mockTenantClient = {
      course: {
        findUnique: jest.fn(),
      },
      lesson: {
        findUnique: jest.fn(),
      },
      criterion: {
        findUnique: jest.fn(),
      },
      lessonCriterion: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockPrismaService = {
      forTenant: jest.fn().mockReturnValue(mockTenantClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetencyMappingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CompetencyMappingService>(CompetencyMappingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAvailableCriteria", () => {
    it("should return available criteria for a course", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.getAvailableCriteria(
        mockTenantId,
        mockCourseId,
      );

      expect(result.courseId).toBe(mockCourseId);
      expect(result.standards).toHaveLength(1);
      expect(result.standards[0].elements[0].criteria).toHaveLength(1);
    });

    it("should throw NotFoundException if course not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.getAvailableCriteria(mockTenantId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getLessonMapping", () => {
    it("should return lesson mappings", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue(mockLesson);

      const result = await service.getLessonMapping(mockTenantId, mockLessonId);

      expect(result.lessonId).toBe(mockLessonId);
      expect(result.mappedCriteria).toHaveLength(1);
      expect(result.criteriaIds).toContain(mockCriterionId);
    });

    it("should throw NotFoundException if lesson not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.getLessonMapping(mockTenantId, mockLessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("toggleMapping", () => {
    it("should add mapping if not exists", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue({ id: mockLessonId });
      tenantClient.criterion.findUnique.mockResolvedValue(mockCriterion);
      tenantClient.lessonCriterion.findFirst.mockResolvedValue(null);
      tenantClient.lessonCriterion.create.mockResolvedValue(mockLessonCriterion);

      const result = await service.toggleMapping(
        mockTenantId,
        mockLessonId,
        mockCriterionId,
      );

      expect(result.action).toBe("added");
      expect(tenantClient.lessonCriterion.create).toHaveBeenCalled();
    });

    it("should remove mapping if exists", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue({ id: mockLessonId });
      tenantClient.criterion.findUnique.mockResolvedValue(mockCriterion);
      tenantClient.lessonCriterion.findFirst.mockResolvedValue(
        mockLessonCriterion,
      );
      tenantClient.lessonCriterion.delete.mockResolvedValue({});

      const result = await service.toggleMapping(
        mockTenantId,
        mockLessonId,
        mockCriterionId,
      );

      expect(result.action).toBe("removed");
      expect(tenantClient.lessonCriterion.delete).toHaveBeenCalled();
    });

    it("should throw NotFoundException if lesson not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleMapping(mockTenantId, mockLessonId, mockCriterionId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if criterion not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue({ id: mockLessonId });
      tenantClient.criterion.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleMapping(mockTenantId, mockLessonId, mockCriterionId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("setLessonMappings", () => {
    it("should set multiple mappings", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue({ id: mockLessonId });
      tenantClient.$transaction.mockResolvedValue([]);

      const result = await service.setLessonMappings(mockTenantId, mockLessonId, [
        mockCriterionId,
      ]);

      expect(result.lessonId).toBe(mockLessonId);
      expect(result.count).toBe(1);
      expect(tenantClient.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFoundException if lesson not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.setLessonMappings(mockTenantId, mockLessonId, [mockCriterionId]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getCourseMappingStats", () => {
    it("should return mapping statistics", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.course.findUnique.mockResolvedValue({
        id: mockCourseId,
        modules: [
          {
            lessons: [
              { criteria: [{ criterion: { id: mockCriterionId } }] },
              { criteria: [] },
            ],
          },
        ],
        standards: [
          {
            elements: [
              {
                criteria: [{ id: mockCriterionId }],
              },
            ],
          },
        ],
      });

      const result = await service.getCourseMappingStats(
        mockTenantId,
        mockCourseId,
      );

      expect(result.courseId).toBe(mockCourseId);
      expect(result.totalLessons).toBe(2);
      expect(result.mappedLessons).toBe(1);
      expect(result.totalCriteria).toBe(1);
      expect(result.coveragePercentage).toBeGreaterThanOrEqual(0);
    });

    it("should throw NotFoundException if course not found", async () => {
      const tenantClient = mockPrismaService.forTenant(mockTenantId);
      tenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.getCourseMappingStats(mockTenantId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

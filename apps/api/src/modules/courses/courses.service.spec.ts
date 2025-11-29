import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { PrismaService } from "../../database/prisma.service";
import { CourseStatus } from "@avala/db";

describe("CoursesService", () => {
  let service: CoursesService;

  const mockTenantId = "tenant-123";
  const mockCourseId = "course-456";
  const mockOwnerId = "owner-789";

  const mockCourse = {
    id: mockCourseId,
    code: "COURSE-001",
    title: "Test Course",
    description: "A test course",
    durationHours: 10,
    status: "DRAFT" as CourseStatus,
    tenantId: mockTenantId,
    ownerId: mockOwnerId,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    standards: [],
    owner: {
      id: mockOwnerId,
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
    },
    _count: { modules: 3, assessments: 2 },
  };

  const mockTenantClient = {
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrisma = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe("create", () => {
    const createDto = {
      code: "NEW-COURSE",
      title: "New Course",
      description: "A new course",
      durationHours: 8,
      ownerId: mockOwnerId,
    };

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);
      mockTenantClient.course.create.mockResolvedValue(mockCourse);
    });

    it("should create a new course", async () => {
      const result = await service.create(mockTenantId, createDto);

      expect(result).toEqual(mockCourse);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
      expect(mockTenantClient.course.create).toHaveBeenCalled();
    });

    it("should throw ConflictException if course code exists", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should connect to competency standards if provided", async () => {
      const dtoWithStandards = {
        ...createDto,
        competencyStandardIds: ["std-1", "std-2"],
      };

      await service.create(mockTenantId, dtoWithStandards);

      expect(mockTenantClient.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            standards: {
              connect: [{ id: "std-1" }, { id: "std-2" }],
            },
          }),
        }),
      );
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      mockTenantClient.course.findMany.mockResolvedValue([mockCourse]);
      mockTenantClient.course.count.mockResolvedValue(1);
    });

    it("should return all non-archived courses with pagination", async () => {
      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual([mockCourse]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return course by ID", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findById(mockTenantId, mockCourseId);

      expect(result).toEqual(mockCourse);
      expect(mockTenantClient.course.findUnique).toHaveBeenCalledWith({
        where: { id: mockCourseId },
        include: expect.objectContaining({
          standards: expect.any(Object),
          owner: expect.any(Object),
          modules: expect.any(Object),
        }),
      });
    });

    it("should throw NotFoundException if course not found", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findById(mockTenantId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByCode", () => {
    it("should return course by code", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findByCode(mockTenantId, "COURSE-001");

      expect(result).toEqual(mockCourse);
      expect(mockTenantClient.course.findUnique).toHaveBeenCalledWith({
        where: { code: "COURSE-001" },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException if course not found", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCode(mockTenantId, "NONEXISTENT"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    const updateDto = {
      title: "Updated Course Title",
    };

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.course.update.mockResolvedValue({
        ...mockCourse,
        title: "Updated Course Title",
      });
    });

    it("should update course", async () => {
      const result = await service.update(
        mockTenantId,
        mockCourseId,
        updateDto,
      );

      expect(result.title).toBe("Updated Course Title");
    });

    it("should throw NotFoundException if course not found", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockCourseId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if updating to existing code", async () => {
      mockTenantClient.course.findUnique
        .mockResolvedValueOnce(mockCourse) // First call: check course exists
        .mockResolvedValueOnce({ id: "other-course" }); // Second call: code conflict check

      await expect(
        service.update(mockTenantId, mockCourseId, { code: "EXISTING-CODE" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should set publishedAt when status changes to PUBLISHED", async () => {
      mockTenantClient.course.update.mockResolvedValue({
        ...mockCourse,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      await service.update(mockTenantId, mockCourseId, { status: "PUBLISHED" });

      expect(mockTenantClient.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PUBLISHED",
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("should update competency standards if provided", async () => {
      await service.update(mockTenantId, mockCourseId, {
        competencyStandardIds: ["std-1", "std-2"],
      });

      expect(mockTenantClient.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            standards: {
              set: [{ id: "std-1" }, { id: "std-2" }],
            },
          }),
        }),
      );
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.course.update.mockResolvedValue({
        ...mockCourse,
        status: "ARCHIVED",
      });
    });

    it("should archive course instead of hard delete", async () => {
      const result = await service.delete(mockTenantId, mockCourseId);

      expect(result.status).toBe("ARCHIVED");
      expect(mockTenantClient.course.update).toHaveBeenCalledWith({
        where: { id: mockCourseId },
        data: { status: "ARCHIVED" },
      });
    });

    it("should throw NotFoundException if course not found", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(service.delete(mockTenantId, mockCourseId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("search", () => {
    beforeEach(() => {
      mockTenantClient.course.findMany.mockResolvedValue([mockCourse]);
    });

    it("should search courses by title or code", async () => {
      const result = await service.search(mockTenantId, "Test");

      expect(result).toEqual([mockCourse]);
      expect(mockTenantClient.course.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { status: { not: "ARCHIVED" } },
            {
              OR: [
                { code: { contains: "Test", mode: "insensitive" } },
                { title: { contains: "Test", mode: "insensitive" } },
              ],
            },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getCurriculum", () => {
    const mockCourseWithModules = {
      ...mockCourse,
      modules: [
        {
          id: "module-1",
          title: "Module 1",
          order: 1,
          lessons: [
            { id: "lesson-1", title: "Lesson 1", order: 1 },
            { id: "lesson-2", title: "Lesson 2", order: 2 },
          ],
          _count: { lessons: 2 },
        },
        {
          id: "module-2",
          title: "Module 2",
          order: 2,
          lessons: [{ id: "lesson-3", title: "Lesson 3", order: 1 }],
          _count: { lessons: 1 },
        },
      ],
    };

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(
        mockCourseWithModules,
      );
    });

    it("should return course curriculum tree", async () => {
      const result = await service.getCurriculum(mockTenantId, mockCourseId);

      expect(result).toEqual({
        courseId: mockCourseId,
        courseTitle: "Test Course",
        moduleCount: 2,
        lessonCount: 3,
        modules: mockCourseWithModules.modules,
      });
    });

    it("should throw NotFoundException if course not found", async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.getCurriculum(mockTenantId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { LessonSearchStrategy } from "./lesson-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("LessonSearchStrategy", () => {
  let strategy: LessonSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    lesson: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<LessonSearchStrategy>(LessonSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have LESSON entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.LESSON);
  });

  describe("search", () => {
    const mockLessons = [
      {
        id: "lesson-1",
        title: "Introduction to Variables",
        content: "Variables are containers for storing data values...",
        module: {
          title: "JavaScript Basics",
          course: { id: "course-1", title: "JavaScript 101" },
        },
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "lesson-2",
        title: "Working with Functions",
        content: "Functions are reusable blocks of code...",
        module: {
          title: "JavaScript Basics",
          course: { id: "course-1", title: "JavaScript 101" },
        },
        createdAt: new Date("2024-02-01"),
      },
    ];

    it("should search lessons by query", async () => {
      prisma.lesson.findMany.mockResolvedValue(mockLessons);

      const results = await strategy.search("variables");

      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "variables", mode: "insensitive" } },
            { content: { contains: "variables", mode: "insensitive" } },
          ],
        },
        take: 20,
        include: {
          module: {
            select: {
              title: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.LESSON);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.lesson.findMany.mockResolvedValue([mockLessons[0]]);

      await strategy.search("variables", "tenant-1");

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            module: { course: { tenantId: "tenant-1" } },
          }),
        })
      );
    });

    it("should include module and course metadata", async () => {
      prisma.lesson.findMany.mockResolvedValue([mockLessons[0]]);

      const results = await strategy.search("variables");

      expect(results[0].metadata.moduleTitle).toBe("JavaScript Basics");
      expect(results[0].metadata.courseId).toBe("course-1");
      expect(results[0].metadata.courseTitle).toBe("JavaScript 101");
    });

    it("should construct correct URL", async () => {
      prisma.lesson.findMany.mockResolvedValue([mockLessons[0]]);

      const results = await strategy.search("variables");

      expect(results[0].url).toBe("/courses/course-1/lessons/lesson-1");
    });

    it("should truncate content for description", async () => {
      const longContent = "A".repeat(300);
      prisma.lesson.findMany.mockResolvedValue([
        { ...mockLessons[0], content: longContent },
      ]);

      const results = await strategy.search("variables");

      expect(results[0].description?.length).toBeLessThanOrEqual(200);
    });

    it("should return empty array when no results", async () => {
      prisma.lesson.findMany.mockResolvedValue([]);

      const results = await strategy.search("nonexistent");

      expect(results).toEqual([]);
    });
  });
});

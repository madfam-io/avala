import { Test, TestingModule } from "@nestjs/testing";
import { CourseSearchStrategy } from "./course-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("CourseSearchStrategy", () => {
  let strategy: CourseSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    course: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<CourseSearchStrategy>(CourseSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have COURSE entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.COURSE);
  });

  describe("search", () => {
    const mockCourses = [
      {
        id: "course-1",
        title: "JavaScript Fundamentals",
        description: "Learn JavaScript basics",
        code: "JS101",
        status: "PUBLISHED",
        standards: [{ code: "EC0001", title: "Web Development" }],
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "course-2",
        title: "Advanced JavaScript",
        description: "Advanced JS concepts",
        code: "JS201",
        status: "DRAFT",
        standards: [],
        createdAt: new Date("2024-02-01"),
      },
    ];

    it("should search courses by query", async () => {
      prisma.course.findMany.mockResolvedValue(mockCourses);

      const results = await strategy.search("javascript");

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "javascript", mode: "insensitive" } },
            { description: { contains: "javascript", mode: "insensitive" } },
            { code: { contains: "javascript", mode: "insensitive" } },
          ],
        },
        take: 20,
        include: {
          standards: { select: { code: true, title: true }, take: 1 },
        },
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.COURSE);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.course.findMany.mockResolvedValue([mockCourses[0]]);

      await strategy.search("javascript", "tenant-1");

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should respect limit option", async () => {
      prisma.course.findMany.mockResolvedValue([mockCourses[0]]);

      await strategy.search("javascript", undefined, { limit: 5 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it("should return empty array when no results", async () => {
      prisma.course.findMany.mockResolvedValue([]);

      const results = await strategy.search("nonexistent");

      expect(results).toEqual([]);
    });

    it("should include EC standard in metadata", async () => {
      prisma.course.findMany.mockResolvedValue([mockCourses[0]]);

      const results = await strategy.search("javascript");

      expect(results[0].metadata.ecStandard).toBe("EC0001");
    });

    it("should apply date filter when provided", async () => {
      prisma.course.findMany.mockResolvedValue(mockCourses);

      const results = await strategy.search("javascript", undefined, {
        limit: 20,
        dateFilter: {
          from: new Date("2024-01-15"),
          to: new Date("2024-03-01"),
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("course-2");
    });
  });

  describe("calculateScore", () => {
    it("should return high score for exact match", () => {
      const score = strategy.calculateScore("javascript", ["javascript"]);
      expect(score).toBe(100);
    });

    it("should return lower score for partial match", () => {
      const score = strategy.calculateScore("java", ["javascript"]);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });
  });
});

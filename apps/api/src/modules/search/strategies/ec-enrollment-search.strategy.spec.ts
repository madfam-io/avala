import { Test, TestingModule } from "@nestjs/testing";
import { ECEnrollmentSearchStrategy } from "./ec-enrollment-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("ECEnrollmentSearchStrategy", () => {
  let strategy: ECEnrollmentSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    eCEnrollment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECEnrollmentSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<ECEnrollmentSearchStrategy>(ECEnrollmentSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have EC_ENROLLMENT entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.EC_ENROLLMENT);
  });

  describe("search", () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-1",
        ecId: "ec-1",
        status: "IN_PROGRESS",
        overallProgress: 45,
        enrolledAt: new Date("2024-01-01"),
        ec: {
          id: "ec-1",
          code: "EC0001",
          title: "Web Development Standard",
        },
      },
      {
        id: "enrollment-2",
        userId: "user-2",
        ecId: "ec-2",
        status: "COMPLETED",
        overallProgress: 100,
        enrolledAt: new Date("2024-02-01"),
        ec: {
          id: "ec-2",
          code: "EC0002",
          title: "Mobile Development Standard",
        },
      },
    ];

    it("should search enrollments by query", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue(mockEnrollments);

      const results = await strategy.search("EC0001");

      expect(prisma.eCEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ec: { code: { contains: "ec0001", mode: "insensitive" } } },
            { ec: { title: { contains: "ec0001", mode: "insensitive" } } },
          ],
        },
        take: 20,
        include: {
          ec: { select: { id: true, code: true, title: true } },
        },
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.EC_ENROLLMENT);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([mockEnrollments[0]]);

      await strategy.search("EC0001", "tenant-1");

      expect(prisma.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should include EC code in title", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([mockEnrollments[0]]);

      const results = await strategy.search("EC0001");

      expect(results[0].title).toBe("Enrollment - EC0001");
    });

    it("should include EC title as description", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([mockEnrollments[0]]);

      const results = await strategy.search("EC0001");

      expect(results[0].description).toBe("Web Development Standard");
    });

    it("should include enrollment metadata", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([mockEnrollments[0]]);

      const results = await strategy.search("EC0001");

      expect(results[0].metadata.userId).toBe("user-1");
      expect(results[0].metadata.ecId).toBe("ec-1");
      expect(results[0].metadata.status).toBe("IN_PROGRESS");
      expect(results[0].metadata.progress).toBe(45);
    });

    it("should construct correct URL", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([mockEnrollments[0]]);

      const results = await strategy.search("EC0001");

      expect(results[0].url).toBe("/enrollments/enrollment-1");
    });

    it("should return empty array when no results", async () => {
      prisma.eCEnrollment.findMany.mockResolvedValue([]);

      const results = await strategy.search("nonexistent");

      expect(results).toEqual([]);
    });
  });
});

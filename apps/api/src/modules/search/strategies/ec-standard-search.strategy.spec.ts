import { Test, TestingModule } from "@nestjs/testing";
import { ECStandardSearchStrategy } from "./ec-standard-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("ECStandardSearchStrategy", () => {
  let strategy: ECStandardSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    eCStandard: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECStandardSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<ECStandardSearchStrategy>(ECStandardSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have EC_STANDARD entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.EC_STANDARD);
  });

  describe("search", () => {
    const mockStandards = [
      {
        id: "standard-1",
        code: "EC0001",
        title: "Web Development",
        description: "Standards for web development competencies",
        sector: "Technology",
        status: "ACTIVE",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "standard-2",
        code: "EC0002",
        title: "Mobile Development",
        description: "Standards for mobile app development",
        sector: "Technology",
        status: "ACTIVE",
        createdAt: new Date("2024-02-01"),
      },
    ];

    it("should search standards by query", async () => {
      prisma.eCStandard.findMany.mockResolvedValue(mockStandards);

      const results = await strategy.search("development");

      expect(prisma.eCStandard.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: { contains: "development", mode: "insensitive" } },
            { title: { contains: "development", mode: "insensitive" } },
            { description: { contains: "development", mode: "insensitive" } },
          ],
        },
        take: 20,
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.EC_STANDARD);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.eCStandard.findMany.mockResolvedValue([mockStandards[0]]);

      await strategy.search("development", "tenant-1");

      expect(prisma.eCStandard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should combine code and title for result title", async () => {
      prisma.eCStandard.findMany.mockResolvedValue([mockStandards[0]]);

      const results = await strategy.search("development");

      expect(results[0].title).toBe("EC0001 - Web Development");
    });

    it("should include sector and status in metadata", async () => {
      prisma.eCStandard.findMany.mockResolvedValue([mockStandards[0]]);

      const results = await strategy.search("development");

      expect(results[0].metadata.code).toBe("EC0001");
      expect(results[0].metadata.sector).toBe("Technology");
      expect(results[0].metadata.status).toBe("ACTIVE");
    });

    it("should construct correct URL", async () => {
      prisma.eCStandard.findMany.mockResolvedValue([mockStandards[0]]);

      const results = await strategy.search("development");

      expect(results[0].url).toBe("/ec-standards/standard-1");
    });

    it("should return empty array when no results", async () => {
      prisma.eCStandard.findMany.mockResolvedValue([]);

      const results = await strategy.search("nonexistent");

      expect(results).toEqual([]);
    });
  });
});

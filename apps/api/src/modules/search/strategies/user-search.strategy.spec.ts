import { Test, TestingModule } from "@nestjs/testing";
import { UserSearchStrategy } from "./user-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("UserSearchStrategy", () => {
  let strategy: UserSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<UserSearchStrategy>(UserSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have USER entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.USER);
  });

  describe("search", () => {
    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "STUDENT",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        role: "INSTRUCTOR",
        createdAt: new Date("2024-02-01"),
      },
    ];

    it("should search users by query", async () => {
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const results = await strategy.search("john");

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: "john", mode: "insensitive" } },
            { lastName: { contains: "john", mode: "insensitive" } },
            { email: { contains: "john", mode: "insensitive" } },
          ],
        },
        take: 20,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.USER);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      await strategy.search("john", "tenant-1");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should combine firstName and lastName for title", async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      const results = await strategy.search("john");

      expect(results[0].title).toBe("John Doe");
    });

    it("should use email as title when name is not available", async () => {
      prisma.user.findMany.mockResolvedValue([
        { ...mockUsers[0], firstName: null, lastName: null },
      ]);

      const results = await strategy.search("john");

      expect(results[0].title).toBe("john.doe@example.com");
    });

    it("should include role in description", async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      const results = await strategy.search("john");

      expect(results[0].description).toContain("STUDENT");
      expect(results[0].description).toContain("john.doe@example.com");
    });

    it("should include role in metadata", async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      const results = await strategy.search("john");

      expect(results[0].metadata.role).toBe("STUDENT");
    });

    it("should construct correct URL", async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      const results = await strategy.search("john");

      expect(results[0].url).toBe("/admin/users/user-1");
    });

    it("should return empty array when no results", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const results = await strategy.search("nonexistent");

      expect(results).toEqual([]);
    });
  });
});

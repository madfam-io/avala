import { Test, TestingModule } from "@nestjs/testing";
import {
  CertificationSearchStrategy,
  SimulationSearchStrategy,
  DocumentSearchStrategy,
} from "./misc-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("CertificationSearchStrategy", () => {
  let strategy: CertificationSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    dC3: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<CertificationSearchStrategy>(CertificationSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have CERTIFICATION entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.CERTIFICATION);
  });

  describe("search", () => {
    const mockCerts = [
      {
        id: "cert-1",
        serial: "DC3-2024-00001",
        status: "ISSUED",
        issuedAt: new Date("2024-01-15"),
        course: {
          title: "JavaScript Fundamentals",
          code: "JS101",
        },
      },
    ];

    it("should search certifications by serial", async () => {
      prisma.dC3.findMany.mockResolvedValue(mockCerts);

      const results = await strategy.search("DC3-2024");

      expect(prisma.dC3.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ serial: { contains: "dc3-2024", mode: "insensitive" } }],
        },
        take: 20,
        include: {
          course: { select: { title: true, code: true } },
        },
      });
      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe(SearchEntityType.CERTIFICATION);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.dC3.findMany.mockResolvedValue([mockCerts[0]]);

      await strategy.search("DC3-2024", "tenant-1");

      expect(prisma.dC3.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should use serial as title", async () => {
      prisma.dC3.findMany.mockResolvedValue(mockCerts);

      const results = await strategy.search("DC3-2024");

      expect(results[0].title).toBe("DC3-2024-00001");
    });

    it("should include course title as description", async () => {
      prisma.dC3.findMany.mockResolvedValue(mockCerts);

      const results = await strategy.search("DC3-2024");

      expect(results[0].description).toBe("JavaScript Fundamentals");
    });

    it("should include metadata", async () => {
      prisma.dC3.findMany.mockResolvedValue(mockCerts);

      const results = await strategy.search("DC3-2024");

      expect(results[0].metadata.status).toBe("ISSUED");
      expect(results[0].metadata.courseCode).toBe("JS101");
    });

    it("should construct correct URL", async () => {
      prisma.dC3.findMany.mockResolvedValue(mockCerts);

      const results = await strategy.search("DC3-2024");

      expect(results[0].url).toBe("/certifications/cert-1");
    });
  });
});

describe("SimulationSearchStrategy", () => {
  let strategy: SimulationSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    eCSimulation: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<SimulationSearchStrategy>(SimulationSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have SIMULATION_SCENARIO entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.SIMULATION_SCENARIO);
  });

  describe("search", () => {
    const mockSimulations = [
      {
        id: "sim-1",
        title: "Customer Service Scenario",
        code: "SIM001",
        type: "ROLE_PLAY",
        createdAt: new Date("2024-01-01"),
        ec: {
          code: "EC0001",
          title: "Customer Service Standard",
        },
      },
    ];

    it("should search simulations by query", async () => {
      prisma.eCSimulation.findMany.mockResolvedValue(mockSimulations);

      const results = await strategy.search("customer");

      expect(prisma.eCSimulation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "customer", mode: "insensitive" } },
            { code: { contains: "customer", mode: "insensitive" } },
          ],
        },
        take: 20,
        include: {
          ec: { select: { code: true, title: true } },
        },
      });
      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe(SearchEntityType.SIMULATION_SCENARIO);
    });

    it("should use title as result title", async () => {
      prisma.eCSimulation.findMany.mockResolvedValue(mockSimulations);

      const results = await strategy.search("customer");

      expect(results[0].title).toBe("Customer Service Scenario");
    });

    it("should include EC title as description", async () => {
      prisma.eCSimulation.findMany.mockResolvedValue(mockSimulations);

      const results = await strategy.search("customer");

      expect(results[0].description).toBe("Customer Service Standard");
    });

    it("should include metadata", async () => {
      prisma.eCSimulation.findMany.mockResolvedValue(mockSimulations);

      const results = await strategy.search("customer");

      expect(results[0].metadata.type).toBe("ROLE_PLAY");
      expect(results[0].metadata.ecCode).toBe("EC0001");
    });

    it("should construct correct URL", async () => {
      prisma.eCSimulation.findMany.mockResolvedValue(mockSimulations);

      const results = await strategy.search("customer");

      expect(results[0].url).toBe("/simulations/sim-1");
    });
  });
});

describe("DocumentSearchStrategy", () => {
  let strategy: DocumentSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    document: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<DocumentSearchStrategy>(DocumentSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have DOCUMENT entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.DOCUMENT);
  });

  describe("search", () => {
    const mockDocuments = [
      {
        id: "doc-12345678-abcd",
        title: "Employee Handbook",
        status: "APPROVED",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "doc-87654321-efgh",
        title: null,
        status: "PENDING",
        createdAt: new Date("2024-02-01"),
      },
    ];

    it("should search documents by title", async () => {
      prisma.document.findMany.mockResolvedValue(mockDocuments);

      const results = await strategy.search("handbook");

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ title: { contains: "handbook", mode: "insensitive" } }],
        },
        take: 20,
      });
      expect(results).toHaveLength(2);
      expect(results[0].entityType).toBe(SearchEntityType.DOCUMENT);
    });

    it("should filter by tenantId when provided", async () => {
      prisma.document.findMany.mockResolvedValue([mockDocuments[0]]);

      await strategy.search("handbook", "tenant-1");

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
          }),
        })
      );
    });

    it("should use title when available", async () => {
      prisma.document.findMany.mockResolvedValue([mockDocuments[0]]);

      const results = await strategy.search("handbook");

      expect(results[0].title).toBe("Employee Handbook");
    });

    it("should use document ID prefix when title is null", async () => {
      prisma.document.findMany.mockResolvedValue([mockDocuments[1]]);

      const results = await strategy.search("document");

      expect(results[0].title).toBe("Document doc-8765");
    });

    it("should include status in metadata", async () => {
      prisma.document.findMany.mockResolvedValue([mockDocuments[0]]);

      const results = await strategy.search("handbook");

      expect(results[0].metadata.status).toBe("APPROVED");
    });

    it("should construct correct URL", async () => {
      prisma.document.findMany.mockResolvedValue([mockDocuments[0]]);

      const results = await strategy.search("handbook");

      expect(results[0].url).toBe("/documents/doc-12345678-abcd");
    });
  });
});

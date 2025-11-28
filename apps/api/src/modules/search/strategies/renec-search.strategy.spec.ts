import { Test, TestingModule } from "@nestjs/testing";
import {
  RenecCenterSearchStrategy,
  RenecCertifierSearchStrategy,
  RenecECSearchStrategy,
} from "./renec-search.strategy";
import { PrismaService } from "../../../database/prisma.service";
import { SearchEntityType } from "../dto/search.dto";

describe("RenecCenterSearchStrategy", () => {
  let strategy: RenecCenterSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    renecCenter: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenecCenterSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<RenecCenterSearchStrategy>(RenecCenterSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have RENEC_CENTRO entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.RENEC_CENTRO);
  });

  describe("search", () => {
    const mockCenters = [
      {
        id: "center-1",
        nombre: "Centro de Capacitación Norte",
        direccion: "Av. Principal 123",
        municipio: "Monterrey",
        estado: "Nuevo León",
        telefono: "555-1234",
        createdAt: new Date("2024-01-01"),
      },
    ];

    it("should search centers by query", async () => {
      prisma.renecCenter.findMany.mockResolvedValue(mockCenters);

      const results = await strategy.search("monterrey");

      expect(prisma.renecCenter.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { nombre: { contains: "monterrey", mode: "insensitive" } },
            { direccion: { contains: "monterrey", mode: "insensitive" } },
            { municipio: { contains: "monterrey", mode: "insensitive" } },
          ],
        },
        take: 20,
      });
      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe(SearchEntityType.RENEC_CENTRO);
    });

    it("should include location in description", async () => {
      prisma.renecCenter.findMany.mockResolvedValue(mockCenters);

      const results = await strategy.search("monterrey");

      expect(results[0].description).toContain("Monterrey");
      expect(results[0].description).toContain("Nuevo León");
    });

    it("should include metadata", async () => {
      prisma.renecCenter.findMany.mockResolvedValue(mockCenters);

      const results = await strategy.search("monterrey");

      expect(results[0].metadata.estado).toBe("Nuevo León");
      expect(results[0].metadata.telefono).toBe("555-1234");
    });

    it("should construct correct URL", async () => {
      prisma.renecCenter.findMany.mockResolvedValue(mockCenters);

      const results = await strategy.search("monterrey");

      expect(results[0].url).toBe("/renec/centers/center-1");
    });
  });
});

describe("RenecCertifierSearchStrategy", () => {
  let strategy: RenecCertifierSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    renecCertifier: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenecCertifierSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<RenecCertifierSearchStrategy>(RenecCertifierSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have RENEC_CERTIFICADOR entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.RENEC_CERTIFICADOR);
  });

  describe("search", () => {
    const mockCertifiers = [
      {
        id: "certifier-1",
        razonSocial: "Certificadora Nacional SA de CV",
        nombreComercial: "CertNacional",
        direccion: "Calle 5 #100",
        tipo: "ORGANISMO",
        estado: "ACTIVO",
        createdAt: new Date("2024-01-01"),
      },
    ];

    it("should search certifiers by query", async () => {
      prisma.renecCertifier.findMany.mockResolvedValue(mockCertifiers);

      const results = await strategy.search("certificadora");

      expect(prisma.renecCertifier.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { razonSocial: { contains: "certificadora", mode: "insensitive" } },
            { nombreComercial: { contains: "certificadora", mode: "insensitive" } },
            { direccion: { contains: "certificadora", mode: "insensitive" } },
          ],
        },
        take: 20,
      });
      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe(SearchEntityType.RENEC_CERTIFICADOR);
    });

    it("should use razonSocial as title", async () => {
      prisma.renecCertifier.findMany.mockResolvedValue(mockCertifiers);

      const results = await strategy.search("certificadora");

      expect(results[0].title).toBe("Certificadora Nacional SA de CV");
    });

    it("should include metadata", async () => {
      prisma.renecCertifier.findMany.mockResolvedValue(mockCertifiers);

      const results = await strategy.search("certificadora");

      expect(results[0].metadata.nombreComercial).toBe("CertNacional");
      expect(results[0].metadata.tipo).toBe("ORGANISMO");
      expect(results[0].metadata.estado).toBe("ACTIVO");
    });

    it("should construct correct URL", async () => {
      prisma.renecCertifier.findMany.mockResolvedValue(mockCertifiers);

      const results = await strategy.search("certificadora");

      expect(results[0].url).toBe("/renec/certifiers/certifier-1");
    });
  });
});

describe("RenecECSearchStrategy", () => {
  let strategy: RenecECSearchStrategy;
  let prisma: any;

  const mockPrismaService = {
    renecEC: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenecECSearchStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<RenecECSearchStrategy>(RenecECSearchStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should have RENEC_EC entity type", () => {
    expect(strategy.entityType).toBe(SearchEntityType.RENEC_EC);
  });

  describe("search", () => {
    const mockECs = [
      {
        id: "renec-ec-1",
        ecClave: "EC0001",
        titulo: "Desarrollo de Software",
        sector: "Tecnología",
        nivelCompetencia: 3,
        vigente: true,
        createdAt: new Date("2024-01-01"),
      },
    ];

    it("should search ECs by query", async () => {
      prisma.renecEC.findMany.mockResolvedValue(mockECs);

      const results = await strategy.search("desarrollo");

      expect(prisma.renecEC.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ecClave: { contains: "desarrollo", mode: "insensitive" } },
            { titulo: { contains: "desarrollo", mode: "insensitive" } },
            { sector: { contains: "desarrollo", mode: "insensitive" } },
          ],
        },
        take: 20,
      });
      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe(SearchEntityType.RENEC_EC);
    });

    it("should combine ecClave and titulo for title", async () => {
      prisma.renecEC.findMany.mockResolvedValue(mockECs);

      const results = await strategy.search("desarrollo");

      expect(results[0].title).toBe("EC0001 - Desarrollo de Software");
    });

    it("should include metadata", async () => {
      prisma.renecEC.findMany.mockResolvedValue(mockECs);

      const results = await strategy.search("desarrollo");

      expect(results[0].metadata.sector).toBe("Tecnología");
      expect(results[0].metadata.nivel).toBe(3);
      expect(results[0].metadata.vigente).toBe(true);
    });

    it("should construct correct URL", async () => {
      prisma.renecEC.findMany.mockResolvedValue(mockECs);

      const results = await strategy.search("desarrollo");

      expect(results[0].url).toBe("/renec/ec/renec-ec-1");
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { RenecScraperService } from "./renec-scraper.service";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { HarvestMode, HarvestStatus, RenecComponent } from "./dto/renec.dto";
import { RenecSyncStatus } from "@avala/db";

describe("RenecScraperService", () => {
  let service: RenecScraperService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockSyncJob = {
    id: "sync-job-123",
    jobType: "FULL_SYNC",
    status: RenecSyncStatus.RUNNING,
    startedAt: new Date(),
    completedAt: null,
    itemsProcessed: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      renecCenter: {
        count: jest.fn(),
        upsert: jest.fn(),
      },
      renecCertifier: {
        count: jest.fn(),
        upsert: jest.fn(),
      },
      renecEC: {
        count: jest.fn(),
        upsert: jest.fn(),
      },
      renecSyncJob: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === "RENEC_HARVEST_ENABLED") return "false";
        if (key === "NODE_ENV") return "test";
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenecScraperService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<RenecScraperService>(RenecScraperService);
    prismaService = module.get(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should log initialization message", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");

      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith("RENEC Scraper Service initialized");
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Scheduled harvesting:"),
      );
    });
  });

  describe("schedulingEnabled", () => {
    it("should disable scheduling in test environment", () => {
      expect(service["schedulingEnabled"]).toBe(false);
    });

    it("should enable scheduling when RENEC_HARVEST_ENABLED is true", async () => {
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === "RENEC_HARVEST_ENABLED") return "true";
          return undefined;
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          RenecScraperService,
          { provide: PrismaService, useValue: prismaService },
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const svc = module.get<RenecScraperService>(RenecScraperService);
      expect(svc["schedulingEnabled"]).toBe(true);
    });

    it("should enable scheduling in production environment", async () => {
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === "NODE_ENV") return "production";
          return undefined;
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          RenecScraperService,
          { provide: PrismaService, useValue: prismaService },
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();

      const svc = module.get<RenecScraperService>(RenecScraperService);
      expect(svc["schedulingEnabled"]).toBe(true);
    });
  });

  describe("scheduledDailyProbe", () => {
    it("should skip when scheduling is disabled", async () => {
      const startHarvestSpy = jest.spyOn(service, "startHarvest");

      await service.scheduledDailyProbe();

      expect(startHarvestSpy).not.toHaveBeenCalled();
    });
  });

  describe("scheduledWeeklyHarvest", () => {
    it("should skip when scheduling is disabled", async () => {
      const startHarvestSpy = jest.spyOn(service, "startHarvest");

      await service.scheduledWeeklyHarvest();

      expect(startHarvestSpy).not.toHaveBeenCalled();
    });
  });

  describe("scheduledFreshnessCheck", () => {
    it("should skip when scheduling is disabled", async () => {
      const checkFreshnessSpy = jest.spyOn(service, "checkDataFreshness");

      await service.scheduledFreshnessCheck();

      expect(checkFreshnessSpy).not.toHaveBeenCalled();
    });
  });

  describe("checkDataFreshness", () => {
    it("should return stale data counts", async () => {
      (prismaService.renecCenter.count as jest.Mock).mockResolvedValue(5);
      (prismaService.renecCertifier.count as jest.Mock).mockResolvedValue(3);
      (prismaService.renecEC.count as jest.Mock).mockResolvedValue(10);

      const result = await service.checkDataFreshness();

      expect(result).toEqual({
        staleCenters: 5,
        staleCertifiers: 3,
        staleECs: 10,
      });
    });

    it("should handle zero stale items", async () => {
      (prismaService.renecCenter.count as jest.Mock).mockResolvedValue(0);
      (prismaService.renecCertifier.count as jest.Mock).mockResolvedValue(0);
      (prismaService.renecEC.count as jest.Mock).mockResolvedValue(0);

      const result = await service.checkDataFreshness();

      expect(result).toEqual({
        staleCenters: 0,
        staleCertifiers: 0,
        staleECs: 0,
      });
    });
  });

  describe("startHarvest", () => {
    beforeEach(() => {
      (prismaService.renecSyncJob.create as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
      (prismaService.renecSyncJob.update as jest.Mock).mockResolvedValue({
        ...mockSyncJob,
        status: RenecSyncStatus.COMPLETED,
      });
    });

    it("should throw error if harvest is already running", async () => {
      // Start first harvest
      service["isRunning"] = true;

      await expect(
        service.startHarvest({ mode: HarvestMode.PROBE }),
      ).rejects.toThrow("A harvest is already running");
    });

    it("should create sync job record", async () => {
      await service.startHarvest({ mode: HarvestMode.PROBE });

      expect(prismaService.renecSyncJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobType: expect.any(String),
          status: RenecSyncStatus.RUNNING,
          startedAt: expect.any(Date),
        }),
      });
    });

    it("should complete harvest successfully", async () => {
      const result = await service.startHarvest({ mode: HarvestMode.PROBE });

      expect(result.status).toBe(HarvestStatus.COMPLETED);
      expect(result.endTime).toBeDefined();
      expect(prismaService.renecSyncJob.update).toHaveBeenCalledWith({
        where: { id: mockSyncJob.id },
        data: expect.objectContaining({
          status: RenecSyncStatus.COMPLETED,
        }),
      });
    });

    it("should use default components when not specified", async () => {
      const result = await service.startHarvest({ mode: HarvestMode.PROBE });

      expect(result.components).toEqual([
        RenecComponent.EC_STANDARDS,
        RenecComponent.CERTIFICADORES,
      ]);
    });

    it("should use custom components when specified", async () => {
      const result = await service.startHarvest({
        mode: HarvestMode.HARVEST,
        components: [RenecComponent.CENTROS],
      });

      expect(result.components).toContain(RenecComponent.CENTROS);
    });

    it("should set isRunning to false after completion", async () => {
      await service.startHarvest({ mode: HarvestMode.PROBE });

      expect(service["isRunning"]).toBe(false);
    });
  });

  describe("dailyProbe", () => {
    beforeEach(() => {
      (prismaService.renecSyncJob.create as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
      (prismaService.renecSyncJob.update as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
    });

    it("should start probe harvest", async () => {
      const result = await service.dailyProbe();

      expect(result.mode).toBe(HarvestMode.PROBE);
    });
  });

  describe("weeklyFullHarvest", () => {
    beforeEach(() => {
      (prismaService.renecSyncJob.create as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
      (prismaService.renecSyncJob.update as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
    });

    it("should start full harvest", async () => {
      const result = await service.weeklyFullHarvest();

      expect(result.mode).toBe(HarvestMode.HARVEST);
      expect(result.components).toContain(RenecComponent.EC_STANDARDS);
      expect(result.components).toContain(RenecComponent.CERTIFICADORES);
      expect(result.components).toContain(RenecComponent.CENTROS);
    });
  });

  describe("stopHarvest", () => {
    it("should stop active harvest run", async () => {
      (prismaService.renecSyncJob.create as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );
      (prismaService.renecSyncJob.update as jest.Mock).mockResolvedValue(
        mockSyncJob,
      );

      // Start a harvest
      const harvestPromise = service.startHarvest({ mode: HarvestMode.PROBE });
      const activeRun = service.getActiveRun();

      if (activeRun) {
        const stopped = await service.stopHarvest(activeRun.id);
        expect(stopped).toBe(true);
      }

      await harvestPromise;
    });

    it("should return false for non-existent run", async () => {
      const stopped = await service.stopHarvest("non-existent-id");

      expect(stopped).toBe(false);
    });
  });

  describe("getActiveRun", () => {
    it("should return null when no harvest is running", () => {
      expect(service.getActiveRun()).toBeNull();
    });
  });

  describe("getHarvestRuns", () => {
    it("should return harvest run history", async () => {
      const mockRuns = [
        {
          id: "run-1",
          status: RenecSyncStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date(),
          itemsProcessed: 100,
          errors: [],
          createdAt: new Date(),
        },
        {
          id: "run-2",
          status: RenecSyncStatus.FAILED,
          startedAt: new Date(),
          completedAt: new Date(),
          itemsProcessed: 50,
          errors: [{ message: "Test error" }],
          createdAt: new Date(),
        },
      ];

      (prismaService.renecSyncJob.findMany as jest.Mock).mockResolvedValue(
        mockRuns,
      );

      const result = await service.getHarvestRuns(10);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(HarvestStatus.COMPLETED);
      expect(result[1].status).toBe(HarvestStatus.FAILED);
      expect(result[1].errors).toBe(1);
    });

    it("should respect limit parameter", async () => {
      (prismaService.renecSyncJob.findMany as jest.Mock).mockResolvedValue([]);

      await service.getHarvestRuns(5);

      expect(prismaService.renecSyncJob.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });
  });

  describe("computeContentHash", () => {
    it("should compute deterministic hash", () => {
      const data = { name: "Test", value: 123 };

      const hash1 = service.computeContentHash(data);
      const hash2 = service.computeContentHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce different hashes for different data", () => {
      const hash1 = service.computeContentHash({ a: 1 });
      const hash2 = service.computeContentHash({ a: 2 });

      expect(hash1).not.toBe(hash2);
    });

    it("should sort keys for consistent hashing", () => {
      const hash1 = service.computeContentHash({ b: 2, a: 1 });
      const hash2 = service.computeContentHash({ a: 1, b: 2 });

      expect(hash1).toBe(hash2);
    });
  });

  describe("normalizePhone", () => {
    it("should add +52 prefix to 10-digit numbers", () => {
      const result = service["normalizePhone"]("5512345678");

      expect(result).toBe("+525512345678");
    });

    it("should preserve existing + prefix", () => {
      const result = service["normalizePhone"]("+525512345678");

      expect(result).toBe("+525512345678");
    });

    it("should strip non-digit characters except +", () => {
      const result = service["normalizePhone"]("(55) 1234-5678");

      expect(result).toBe("+525512345678");
    });

    it("should return null for null input", () => {
      const result = service["normalizePhone"](null);

      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = service["normalizePhone"](undefined);

      expect(result).toBeNull();
    });

    it("should return digits only for non-10-digit numbers", () => {
      const result = service["normalizePhone"]("123456");

      expect(result).toBe("123456");
    });
  });

  describe("normalizeEstadoInegi", () => {
    it("should return INEGI code for valid state", () => {
      const result = service["normalizeEstadoInegi"]("Jalisco");

      expect(result).toBe("14");
    });

    it("should handle Ciudad de México", () => {
      const result = service["normalizeEstadoInegi"]("Ciudad de México");

      expect(result).toBe("09");
    });

    it("should handle CDMX alias", () => {
      const result = service["normalizeEstadoInegi"]("CDMX");

      expect(result).toBe("09");
    });

    it("should return null for unknown state", () => {
      const result = service["normalizeEstadoInegi"]("Unknown State");

      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = service["normalizeEstadoInegi"](null);

      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = service["normalizeEstadoInegi"](undefined);

      expect(result).toBeNull();
    });

    it("should trim whitespace", () => {
      const result = service["normalizeEstadoInegi"]("  Jalisco  ");

      expect(result).toBe("14");
    });
  });

  describe("validateECCode", () => {
    it("should validate correct EC code format", () => {
      expect(service.validateECCode("EC0249")).toBe(true);
      expect(service.validateECCode("EC1234")).toBe(true);
    });

    it("should validate EC code with version", () => {
      expect(service.validateECCode("EC0249.01")).toBe(true);
      expect(service.validateECCode("EC1234.02")).toBe(true);
    });

    it("should reject invalid EC codes", () => {
      expect(service.validateECCode("EC123")).toBe(false);
      expect(service.validateECCode("EC12345")).toBe(false);
      expect(service.validateECCode("OC0249")).toBe(false);
      expect(service.validateECCode("ec0249")).toBe(false);
      expect(service.validateECCode("")).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email format", () => {
      expect(service.validateEmail("test@example.com")).toBe(true);
      expect(service.validateEmail("user.name@domain.org")).toBe(true);
      expect(service.validateEmail("test+tag@example.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(service.validateEmail("invalid")).toBe(false);
      expect(service.validateEmail("@domain.com")).toBe(false);
      expect(service.validateEmail("test@")).toBe(false);
      expect(service.validateEmail("")).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should validate phone numbers", () => {
      expect(service.validatePhone("5512345678")).toBe(true);
      expect(service.validatePhone("+52 55 1234 5678")).toBe(true);
      expect(service.validatePhone("(55) 1234-5678")).toBe(true);
    });

    it("should reject invalid phone formats", () => {
      expect(service.validatePhone("")).toBe(false);
      expect(service.validatePhone("abc")).toBe(false);
    });
  });

  describe("upsertECFromClient", () => {
    beforeEach(() => {
      (prismaService.renecEC.upsert as jest.Mock).mockResolvedValue({});
    });

    it("should upsert EC standard with code", async () => {
      await service["upsertECFromClient"]({
        code: "EC0249",
        title: "Test Standard",
        version: "01",
        active: true,
      });

      expect(prismaService.renecEC.upsert).toHaveBeenCalledWith({
        where: { ecClave: "EC0249" },
        create: expect.objectContaining({
          ecClave: "EC0249",
          titulo: "Test Standard",
        }),
        update: expect.objectContaining({
          titulo: "Test Standard",
        }),
      });
    });

    it("should skip EC without code", async () => {
      const warnSpy = jest.spyOn(service["logger"], "warn");

      await service["upsertECFromClient"]({ title: "No Code" });

      expect(warnSpy).toHaveBeenCalledWith("EC without code, skipping");
      expect(prismaService.renecEC.upsert).not.toHaveBeenCalled();
    });

    it("should handle ecClave as fallback", async () => {
      await service["upsertECFromClient"]({
        ecClave: "EC0250",
        titulo: "Fallback Title",
      });

      expect(prismaService.renecEC.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ecClave: "EC0250" },
        }),
      );
    });
  });

  describe("upsertCertifierFromClient", () => {
    beforeEach(() => {
      (prismaService.renecCertifier.upsert as jest.Mock).mockResolvedValue({});
    });

    it("should upsert certifier with id", async () => {
      await service["upsertCertifierFromClient"]({
        id: "CERT-001",
        name: "Test Certifier",
        active: true,
      });

      expect(prismaService.renecCertifier.upsert).toHaveBeenCalledWith({
        where: { certId: "CERT-001" },
        create: expect.objectContaining({
          certId: "CERT-001",
          razonSocial: "Test Certifier",
        }),
        update: expect.objectContaining({
          razonSocial: "Test Certifier",
        }),
      });
    });

    it("should skip certifier without ID", async () => {
      const warnSpy = jest.spyOn(service["logger"], "warn");

      await service["upsertCertifierFromClient"]({ name: "No ID" });

      expect(warnSpy).toHaveBeenCalledWith("Certifier without ID, skipping");
      expect(prismaService.renecCertifier.upsert).not.toHaveBeenCalled();
    });

    it("should normalize phone number", async () => {
      await service["upsertCertifierFromClient"]({
        id: "CERT-002",
        name: "Phone Test",
        phone: "5512345678",
      });

      expect(prismaService.renecCertifier.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            telefono: "+525512345678",
          }),
        }),
      );
    });
  });

  describe("upsertCenterFromClient", () => {
    beforeEach(() => {
      (prismaService.renecCenter.upsert as jest.Mock).mockResolvedValue({});
    });

    it("should upsert center with id", async () => {
      await service["upsertCenterFromClient"]({
        id: "CENTER-001",
        name: "Test Center",
        state: "Jalisco",
        active: true,
      });

      expect(prismaService.renecCenter.upsert).toHaveBeenCalledWith({
        where: { centerId: "CENTER-001" },
        create: expect.objectContaining({
          centerId: "CENTER-001",
          nombre: "Test Center",
          estado: "Jalisco",
          estadoInegi: "14",
        }),
        update: expect.objectContaining({
          nombre: "Test Center",
          estado: "Jalisco",
          estadoInegi: "14",
        }),
      });
    });

    it("should skip center without ID", async () => {
      const warnSpy = jest.spyOn(service["logger"], "warn");

      await service["upsertCenterFromClient"]({ name: "No ID" });

      expect(warnSpy).toHaveBeenCalledWith("Center without ID, skipping");
      expect(prismaService.renecCenter.upsert).not.toHaveBeenCalled();
    });

    it("should normalize INEGI state code", async () => {
      await service["upsertCenterFromClient"]({
        id: "CENTER-002",
        name: "CDMX Center",
        state: "Ciudad de México",
      });

      expect(prismaService.renecCenter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            estadoInegi: "09",
          }),
        }),
      );
    });
  });

  describe("harvestComponent (fallback)", () => {
    it("should log warning when renec-client not available", async () => {
      const warnSpy = jest.spyOn(service["logger"], "warn");

      await service["harvestComponent"](RenecComponent.EC_STANDARDS, 500);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("renec-client not available"),
      );
    });
  });
});

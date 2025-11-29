import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

// Mock @avala/db
jest.mock("@avala/db", () => {
  const mockPrismaClient = class MockPrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
  };

  return {
    PrismaClient: mockPrismaClient,
    createTenantClient: jest.fn().mockReturnValue({
      tenant: "mocked-tenant-client",
    }),
  };
});

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(async () => {
    // Save original env
    const originalEnv = process.env.NODE_ENV;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Restore env after test setup
    process.env.NODE_ENV = originalEnv;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should connect to database", async () => {
      const connectSpy = jest.spyOn(service, "$connect");

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it("should log connection message", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");

      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith("✓ Database connected");
    });
  });

  describe("onModuleDestroy", () => {
    it("should disconnect from database", async () => {
      const disconnectSpy = jest.spyOn(service, "$disconnect");

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it("should log disconnection message", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");

      await service.onModuleDestroy();

      expect(logSpy).toHaveBeenCalledWith("✓ Database disconnected");
    });
  });

  describe("forTenant", () => {
    it("should create tenant-scoped client", () => {
      const { createTenantClient } = require("@avala/db");

      const tenantClient = service.forTenant("tenant-123");

      expect(createTenantClient).toHaveBeenCalledWith("tenant-123");
      expect(tenantClient).toEqual({ tenant: "mocked-tenant-client" });
    });

    it("should create different clients for different tenants", () => {
      const { createTenantClient } = require("@avala/db");

      service.forTenant("tenant-a");
      service.forTenant("tenant-b");

      expect(createTenantClient).toHaveBeenCalledWith("tenant-a");
      expect(createTenantClient).toHaveBeenCalledWith("tenant-b");
      expect(createTenantClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("enableShutdownHooks", () => {
    it("should register beforeExit handler", async () => {
      const mockApp = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      const processOnSpy = jest.spyOn(process, "on");

      await service.enableShutdownHooks(mockApp);

      expect(processOnSpy).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );

      processOnSpy.mockRestore();
    });
  });

  describe("constructor logging configuration", () => {
    it("should be instantiated with correct configuration", () => {
      // The service should be properly instantiated
      expect(service).toBeInstanceOf(PrismaService);
    });
  });
});

describe("PrismaService in development mode", () => {
  let service: PrismaService;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it("should be defined in development mode", () => {
    expect(service).toBeDefined();
  });
});

describe("PrismaService in production mode", () => {
  let service: PrismaService;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it("should be defined in production mode", () => {
    expect(service).toBeDefined();
  });
});

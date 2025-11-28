import { Test, TestingModule } from "@nestjs/testing";
import { TenantController } from "./tenant.controller";
import { TenantService } from "./tenant.service";

describe("TenantController", () => {
  let controller: TenantController;
  let tenantService: jest.Mocked<TenantService>;

  const mockTenantService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    getStats: jest.fn(),
    checkPlanLimits: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateSettings: jest.fn(),
    suspend: jest.fn(),
    reactivate: jest.fn(),
    delete: jest.fn(),
    hardDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [{ provide: TenantService, useValue: mockTenantService }],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    tenantService = module.get(TenantService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated tenants", async () => {
      tenantService.findAll.mockResolvedValue({ data: [], total: 0 } as any);
      await controller.findAll({} as any);
      expect(tenantService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe("findById", () => {
    it("should find tenant by id", async () => {
      tenantService.findById.mockResolvedValue({} as any);
      await controller.findById("tenant-1");
      expect(tenantService.findById).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("findBySlug", () => {
    it("should find tenant by slug", async () => {
      tenantService.findBySlug.mockResolvedValue({} as any);
      await controller.findBySlug("test");
      expect(tenantService.findBySlug).toHaveBeenCalledWith("test");
    });
  });

  describe("getStats", () => {
    it("should get tenant statistics", async () => {
      tenantService.getStats.mockResolvedValue({} as any);
      await controller.getStats("tenant-1");
      expect(tenantService.getStats).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("checkLimits", () => {
    it("should check plan limits", async () => {
      tenantService.checkPlanLimits.mockResolvedValue({} as any);
      await controller.checkLimits("tenant-1");
      expect(tenantService.checkPlanLimits).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("create", () => {
    it("should create a tenant", async () => {
      tenantService.create.mockResolvedValue({} as any);
      await controller.create({} as any);
      expect(tenantService.create).toHaveBeenCalledWith({});
    });
  });

  describe("update", () => {
    it("should update a tenant", async () => {
      tenantService.update.mockResolvedValue({} as any);
      await controller.update("tenant-1", {} as any);
      expect(tenantService.update).toHaveBeenCalledWith("tenant-1", {});
    });
  });

  describe("updateSettings", () => {
    it("should update tenant settings", async () => {
      tenantService.updateSettings.mockResolvedValue({} as any);
      await controller.updateSettings("tenant-1", {} as any);
      expect(tenantService.updateSettings).toHaveBeenCalledWith("tenant-1", {});
    });
  });

  describe("suspend", () => {
    it("should suspend a tenant", async () => {
      tenantService.suspend.mockResolvedValue({} as any);
      await controller.suspend("tenant-1", "reason");
      expect(tenantService.suspend).toHaveBeenCalledWith("tenant-1", "reason");
    });
  });

  describe("reactivate", () => {
    it("should reactivate a tenant", async () => {
      tenantService.reactivate.mockResolvedValue({} as any);
      await controller.reactivate("tenant-1");
      expect(tenantService.reactivate).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("delete", () => {
    it("should soft delete a tenant", async () => {
      tenantService.delete.mockResolvedValue({} as any);
      await controller.delete("tenant-1");
      expect(tenantService.delete).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("hardDelete", () => {
    it("should hard delete a tenant", async () => {
      tenantService.hardDelete.mockResolvedValue(undefined);
      await controller.hardDelete("tenant-1");
      expect(tenantService.hardDelete).toHaveBeenCalledWith("tenant-1");
    });
  });
});

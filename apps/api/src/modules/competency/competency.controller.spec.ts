import { Test, TestingModule } from "@nestjs/testing";
import { CompetencyController } from "./competency.controller";
import { CompetencyService } from "./competency.service";

describe("CompetencyController", () => {
  let controller: CompetencyController;
  let competencyService: jest.Mocked<CompetencyService>;

  const mockTenantId = "tenant-1";

  const mockCompetencyService = {
    findAll: jest.fn(),
    search: jest.fn(),
    findByCode: jest.fn(),
    getCoverage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetencyController],
      providers: [
        { provide: CompetencyService, useValue: mockCompetencyService },
      ],
    }).compile();

    controller = module.get<CompetencyController>(CompetencyController);
    competencyService = module.get(CompetencyService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all competency standards", async () => {
      competencyService.findAll.mockResolvedValue([]);
      await controller.findAll(mockTenantId);
      expect(competencyService.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe("search", () => {
    it("should search competency standards", async () => {
      competencyService.search.mockResolvedValue([]);
      await controller.search(mockTenantId, "test");
      expect(competencyService.search).toHaveBeenCalledWith(
        mockTenantId,
        "test",
      );
    });
  });

  describe("findByCode", () => {
    it("should find competency by code", async () => {
      competencyService.findByCode.mockResolvedValue({} as any);
      await controller.findByCode(mockTenantId, "EC0001");
      expect(competencyService.findByCode).toHaveBeenCalledWith(
        mockTenantId,
        "EC0001",
        undefined,
      );
    });

    it("should find competency by code with version", async () => {
      competencyService.findByCode.mockResolvedValue({} as any);
      await controller.findByCode(mockTenantId, "EC0001", "1.0");
      expect(competencyService.findByCode).toHaveBeenCalledWith(
        mockTenantId,
        "EC0001",
        "1.0",
      );
    });
  });

  describe("getCoverage", () => {
    it("should get coverage for a competency", async () => {
      competencyService.getCoverage.mockResolvedValue({} as any);
      await controller.getCoverage(mockTenantId, "course-1");
      expect(competencyService.getCoverage).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
      );
    });
  });
});

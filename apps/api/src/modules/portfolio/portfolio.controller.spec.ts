import { Test, TestingModule } from "@nestjs/testing";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";

describe("PortfolioController", () => {
  let controller: PortfolioController;
  let portfolioService: jest.Mocked<PortfolioService>;

  const mockTenantId = "tenant-1";

  const mockPortfolioService = {
    findByTrainee: jest.fn(),
    findById: jest.fn(),
    exportPortfolio: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    portfolioService = module.get(PortfolioService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findByTrainee", () => {
    it("should find portfolios by trainee", async () => {
      portfolioService.findByTrainee.mockResolvedValue([]);
      await controller.findByTrainee(mockTenantId, "trainee-1");
      expect(portfolioService.findByTrainee).toHaveBeenCalledWith(
        mockTenantId,
        "trainee-1",
      );
    });
  });

  describe("findById", () => {
    it("should find portfolio by id", async () => {
      portfolioService.findById.mockResolvedValue({} as any);
      await controller.findById(mockTenantId, "portfolio-1");
      expect(portfolioService.findById).toHaveBeenCalledWith(
        mockTenantId,
        "portfolio-1",
      );
    });
  });

  describe("exportPortfolio", () => {
    it("should export portfolio", async () => {
      portfolioService.exportPortfolio.mockResolvedValue({} as any);
      await controller.exportPortfolio(mockTenantId, "portfolio-1");
      expect(portfolioService.exportPortfolio).toHaveBeenCalledWith(
        mockTenantId,
        "portfolio-1",
      );
    });
  });
});

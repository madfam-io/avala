import { Test, TestingModule } from "@nestjs/testing";
import { ECPortfolioController } from "./ec-portfolio.controller";
import { ECPortfolioService } from "./ec-portfolio.service";

describe("ECPortfolioController", () => {
  let controller: ECPortfolioController;
  let ecPortfolioService: jest.Mocked<ECPortfolioService>;

  const mockECPortfolioService = {
    // Templates
    createTemplate: jest.fn(),
    findTemplatesByStandard: jest.fn(),
    findTemplateById: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    // Documents
    createDocument: jest.fn(),
    findDocumentsByEnrollment: jest.fn(),
    findDocumentById: jest.fn(),
    updateDocumentContent: jest.fn(),
    autoSaveDocument: jest.fn(),
    submitDocument: jest.fn(),
    approveDocument: jest.fn(),
    rejectDocument: jest.fn(),
    deleteDocument: jest.fn(),
    // Validation
    validateDocument: jest.fn(),
    // Portfolio
    getPortfolioSummary: jest.fn(),
    initializePortfolio: jest.fn(),
    // Export
    exportDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ECPortfolioController],
      providers: [
        { provide: ECPortfolioService, useValue: mockECPortfolioService },
      ],
    }).compile();

    controller = module.get<ECPortfolioController>(ECPortfolioController);
    ecPortfolioService = module.get(ECPortfolioService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // TEMPLATES
  describe("createTemplate", () => {
    it("should create template", async () => {
      ecPortfolioService.createTemplate.mockResolvedValue({} as any);
      await controller.createTemplate("EC0249", {} as any);
      expect(ecPortfolioService.createTemplate).toHaveBeenCalledWith(
        "EC0249",
        {},
      );
    });
  });

  describe("findTemplates", () => {
    it("should find templates by standard", async () => {
      ecPortfolioService.findTemplatesByStandard.mockResolvedValue([]);
      await controller.findTemplates("EC0249", {} as any);
      expect(ecPortfolioService.findTemplatesByStandard).toHaveBeenCalledWith(
        "EC0249",
        {},
      );
    });
  });

  describe("findTemplateById", () => {
    it("should find template by id", async () => {
      ecPortfolioService.findTemplateById.mockResolvedValue({} as any);
      await controller.findTemplateById("tpl-1");
      expect(ecPortfolioService.findTemplateById).toHaveBeenCalledWith("tpl-1");
    });
  });

  describe("updateTemplate", () => {
    it("should update template", async () => {
      ecPortfolioService.updateTemplate.mockResolvedValue({} as any);
      await controller.updateTemplate("tpl-1", {} as any);
      expect(ecPortfolioService.updateTemplate).toHaveBeenCalledWith(
        "tpl-1",
        {},
      );
    });
  });

  describe("deleteTemplate", () => {
    it("should delete template", async () => {
      ecPortfolioService.deleteTemplate.mockResolvedValue({} as any);
      await controller.deleteTemplate("tpl-1");
      expect(ecPortfolioService.deleteTemplate).toHaveBeenCalledWith("tpl-1");
    });
  });

  // DOCUMENTS
  describe("createDocument", () => {
    it("should create document", async () => {
      ecPortfolioService.createDocument.mockResolvedValue({} as any);
      await controller.createDocument("enroll-1", {} as any);
      expect(ecPortfolioService.createDocument).toHaveBeenCalledWith(
        "enroll-1",
        {},
      );
    });
  });

  describe("findDocuments", () => {
    it("should find documents by enrollment", async () => {
      ecPortfolioService.findDocumentsByEnrollment.mockResolvedValue([]);
      await controller.findDocuments("enroll-1", {} as any);
      expect(ecPortfolioService.findDocumentsByEnrollment).toHaveBeenCalledWith(
        "enroll-1",
        {},
      );
    });
  });

  describe("findDocumentById", () => {
    it("should find document by id", async () => {
      ecPortfolioService.findDocumentById.mockResolvedValue({} as any);
      await controller.findDocumentById("doc-1");
      expect(ecPortfolioService.findDocumentById).toHaveBeenCalledWith("doc-1");
    });
  });

  describe("updateDocumentContent", () => {
    it("should update document content", async () => {
      ecPortfolioService.updateDocumentContent.mockResolvedValue({} as any);
      await controller.updateDocumentContent("doc-1", {} as any);
      expect(ecPortfolioService.updateDocumentContent).toHaveBeenCalledWith(
        "doc-1",
        {},
      );
    });
  });

  describe("autoSaveDocument", () => {
    it("should auto-save document", async () => {
      ecPortfolioService.autoSaveDocument.mockResolvedValue({} as any);
      await controller.autoSaveDocument("doc-1", { content: {} });
      expect(ecPortfolioService.autoSaveDocument).toHaveBeenCalledWith(
        "doc-1",
        {},
      );
    });
  });

  describe("submitDocument", () => {
    it("should submit document", async () => {
      ecPortfolioService.submitDocument.mockResolvedValue({} as any);
      await controller.submitDocument("doc-1");
      expect(ecPortfolioService.submitDocument).toHaveBeenCalledWith("doc-1");
    });
  });

  describe("approveDocument", () => {
    it("should approve document", async () => {
      ecPortfolioService.approveDocument.mockResolvedValue({} as any);
      await controller.approveDocument("doc-1");
      expect(ecPortfolioService.approveDocument).toHaveBeenCalledWith("doc-1");
    });
  });

  describe("rejectDocument", () => {
    it("should reject document", async () => {
      ecPortfolioService.rejectDocument.mockResolvedValue({} as any);
      await controller.rejectDocument("doc-1", { reason: "Incomplete" });
      expect(ecPortfolioService.rejectDocument).toHaveBeenCalledWith(
        "doc-1",
        "Incomplete",
      );
    });
  });

  describe("deleteDocument", () => {
    it("should delete document", async () => {
      ecPortfolioService.deleteDocument.mockResolvedValue({} as any);
      await controller.deleteDocument("doc-1");
      expect(ecPortfolioService.deleteDocument).toHaveBeenCalledWith("doc-1");
    });
  });

  // VALIDATION
  describe("validateDocument", () => {
    it("should validate document", async () => {
      ecPortfolioService.validateDocument.mockResolvedValue({} as any);
      await controller.validateDocument("doc-1");
      expect(ecPortfolioService.validateDocument).toHaveBeenCalledWith("doc-1");
    });
  });

  // PORTFOLIO
  describe("getPortfolioSummary", () => {
    it("should get portfolio summary", async () => {
      ecPortfolioService.getPortfolioSummary.mockResolvedValue({} as any);
      await controller.getPortfolioSummary("enroll-1");
      expect(ecPortfolioService.getPortfolioSummary).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  describe("initializePortfolio", () => {
    it("should initialize portfolio", async () => {
      ecPortfolioService.initializePortfolio.mockResolvedValue([]);
      await controller.initializePortfolio("enroll-1");
      expect(ecPortfolioService.initializePortfolio).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  // EXPORT
  describe("exportDocument", () => {
    it("should export document", async () => {
      ecPortfolioService.exportDocument.mockResolvedValue({} as any);
      await controller.exportDocument("doc-1");
      expect(ecPortfolioService.exportDocument).toHaveBeenCalledWith("doc-1");
    });
  });
});

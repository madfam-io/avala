import { Test, TestingModule } from "@nestjs/testing";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

describe("DocumentsController", () => {
  let controller: DocumentsController;
  let documentsService: jest.Mocked<DocumentsService>;

  const mockDocumentsService = {
    findAllTemplates: jest.fn(),
    findTemplatesByElement: jest.fn(),
    findTemplateByCode: jest.fn(),
    findUserDocuments: jest.fn(),
    findDocumentsByElement: jest.fn(),
    findDocument: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    submitDocument: jest.fn(),
    deleteDocument: jest.fn(),
    updatePortfolioProgress: jest.fn(),
  };

  const mockReq = {
    user: { id: "user-1", tenantId: "tenant-1" },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get(DocumentsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllTemplates", () => {
    it("should return all templates", async () => {
      documentsService.findAllTemplates.mockResolvedValue([]);
      await controller.findAllTemplates();
      expect(documentsService.findAllTemplates).toHaveBeenCalled();
    });
  });

  describe("findTemplatesByElement", () => {
    it("should return templates by element", async () => {
      documentsService.findTemplatesByElement.mockResolvedValue([]);
      await controller.findTemplatesByElement("E0875");
      expect(documentsService.findTemplatesByElement).toHaveBeenCalledWith(
        "E0875",
      );
    });
  });

  describe("findTemplateByCode", () => {
    it("should return template by code", async () => {
      documentsService.findTemplateByCode.mockResolvedValue({} as any);
      await controller.findTemplateByCode("DOC001");
      expect(documentsService.findTemplateByCode).toHaveBeenCalledWith(
        "DOC001",
      );
    });
  });

  describe("findUserDocuments", () => {
    it("should return user documents", async () => {
      documentsService.findUserDocuments.mockResolvedValue([]);
      await controller.findUserDocuments(mockReq);
      expect(documentsService.findUserDocuments).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("findDocumentsByElement", () => {
    it("should return documents by element", async () => {
      documentsService.findDocumentsByElement.mockResolvedValue([]);
      await controller.findDocumentsByElement("E0875", mockReq);
      expect(documentsService.findDocumentsByElement).toHaveBeenCalledWith(
        "E0875",
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("findDocument", () => {
    it("should return document by id", async () => {
      documentsService.findDocument.mockResolvedValue({} as any);
      await controller.findDocument("doc-1", mockReq);
      expect(documentsService.findDocument).toHaveBeenCalledWith(
        "doc-1",
        "user-1",
      );
    });
  });

  describe("createDocument", () => {
    it("should create document", async () => {
      documentsService.createDocument.mockResolvedValue({} as any);
      await controller.createDocument({} as any, mockReq);
      expect(documentsService.createDocument).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
        {},
      );
    });
  });

  describe("updateDocument", () => {
    it("should update document", async () => {
      documentsService.updateDocument.mockResolvedValue({} as any);
      await controller.updateDocument("doc-1", {} as any, mockReq);
      expect(documentsService.updateDocument).toHaveBeenCalledWith(
        "doc-1",
        "user-1",
        {},
      );
    });
  });

  describe("submitDocument", () => {
    it("should submit document", async () => {
      documentsService.submitDocument.mockResolvedValue({} as any);
      await controller.submitDocument("doc-1", mockReq);
      expect(documentsService.submitDocument).toHaveBeenCalledWith(
        "doc-1",
        "user-1",
      );
    });
  });

  describe("deleteDocument", () => {
    it("should delete document", async () => {
      documentsService.deleteDocument.mockResolvedValue(undefined);
      await controller.deleteDocument("doc-1", mockReq);
      expect(documentsService.deleteDocument).toHaveBeenCalledWith(
        "doc-1",
        "user-1",
      );
    });
  });

  describe("getPortfolioProgress", () => {
    it("should get portfolio progress", async () => {
      documentsService.updatePortfolioProgress.mockResolvedValue({} as any);
      await controller.getPortfolioProgress(mockReq);
      expect(documentsService.updatePortfolioProgress).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
        "EC0249",
      );
    });
  });
});

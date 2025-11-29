import { Test, TestingModule } from "@nestjs/testing";
import { DocumentsService } from "./documents.service";
import { PrismaService } from "../../database/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { DocumentStatus } from "@avala/db";

describe("DocumentsService", () => {
  let service: DocumentsService;

  const mockUserId = "user-123";
  const mockTenantId = "tenant-123";
  const mockDocumentId = "document-123";
  const mockTemplateId = "template-123";

  const mockTemplate = {
    id: mockTemplateId,
    templateCode: "PNC-E0875",
    title: "Plan de Capacitación",
    element: "E0875",
    icon: "📋",
    sections: [
      { id: "intro", title: "Introducción" },
      { id: "objectives", title: "Objetivos" },
    ],
  };

  const mockDocument = {
    id: mockDocumentId,
    userId: mockUserId,
    tenantId: mockTenantId,
    templateId: mockTemplateId,
    title: "Test Document",
    status: DocumentStatus.DRAFT,
    content: { intro: { value: "test" }, objectives: { value: "" } },
    isComplete: false,
    validationScore: 50,
    template: mockTemplate,
  };

  const mockPrismaService = {
    documentTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    documentPortfolio: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAllTemplates", () => {
    it("should return all templates with pagination", async () => {
      mockPrismaService.documentTemplate.findMany.mockResolvedValue([
        mockTemplate,
      ]);
      mockPrismaService.documentTemplate.count.mockResolvedValue(1);

      const result = await service.findAllTemplates({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findTemplatesByElement", () => {
    it("should return templates by element", async () => {
      mockPrismaService.documentTemplate.findMany.mockResolvedValue([
        mockTemplate,
      ]);

      const result = await service.findTemplatesByElement("E0875");

      expect(mockPrismaService.documentTemplate.findMany).toHaveBeenCalledWith({
        where: { element: "E0875" },
        orderBy: { orderIndex: "asc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findTemplateByCode", () => {
    it("should return template by code", async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );

      const result = await service.findTemplateByCode("PNC-E0875");

      expect(result).toEqual(mockTemplate);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findTemplateByCode("INVALID")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findUserDocuments", () => {
    it("should return user documents with pagination", async () => {
      mockPrismaService.document.findMany.mockResolvedValue([mockDocument]);
      mockPrismaService.document.count.mockResolvedValue(1);

      const result = await service.findUserDocuments(mockUserId, mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findDocument", () => {
    it("should return document by ID", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(mockDocument);

      const result = await service.findDocument(mockDocumentId, mockUserId);

      expect(result).toEqual(mockDocument);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(null);

      await expect(
        service.findDocument("invalid-id", mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createDocument", () => {
    it("should create document from template", async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.document.create.mockResolvedValue(mockDocument);

      const result = await service.createDocument(mockUserId, mockTenantId, {
        templateCode: "PNC-E0875",
      });

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            tenantId: mockTenantId,
            status: DocumentStatus.DRAFT,
          }),
        }),
      );
    });

    it("should use custom title if provided", async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.document.create.mockResolvedValue({
        ...mockDocument,
        title: "Custom Title",
      });

      const result = await service.createDocument(mockUserId, mockTenantId, {
        templateCode: "PNC-E0875",
        title: "Custom Title",
      });

      expect(result.title).toBe("Custom Title");
    });
  });

  describe("updateDocument", () => {
    it("should update document content", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDocument,
        content: { intro: { value: "updated" }, objectives: { value: "done" } },
        validationScore: 100,
        isComplete: true,
      });

      const result = await service.updateDocument(mockDocumentId, mockUserId, {
        content: { intro: { value: "updated" }, objectives: { value: "done" } },
      });

      expect(result.isComplete).toBe(true);
    });

    it("should calculate validation score", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDocument,
        validationScore: 50,
      });

      await service.updateDocument(mockDocumentId, mockUserId, {
        content: { intro: { value: "test" }, objectives: { value: "" } },
      });

      expect(mockPrismaService.document.update).toHaveBeenCalled();
    });
  });

  describe("submitDocument", () => {
    it("should submit complete document", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue({
        ...mockDocument,
        isComplete: true,
      });
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.SUBMITTED,
      });

      const result = await service.submitDocument(mockDocumentId, mockUserId);

      expect(result.status).toBe(DocumentStatus.SUBMITTED);
    });

    it("should throw if document not complete", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(mockDocument);

      await expect(
        service.submitDocument(mockDocumentId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if document already submitted", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.APPROVED,
        isComplete: true,
      });

      await expect(
        service.submitDocument(mockDocumentId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document", async () => {
      mockPrismaService.document.findFirst.mockResolvedValue(mockDocument);
      mockPrismaService.document.delete.mockResolvedValue({});

      const result = await service.deleteDocument(mockDocumentId, mockUserId);

      expect(result.success).toBe(true);
    });
  });

  describe("getOrCreatePortfolio", () => {
    it("should return existing portfolio", async () => {
      const mockPortfolio = { id: "portfolio-1", userId: mockUserId };
      mockPrismaService.documentPortfolio.findUnique.mockResolvedValue(
        mockPortfolio,
      );

      const result = await service.getOrCreatePortfolio(
        mockUserId,
        mockTenantId,
        "EC0249",
      );

      expect(result).toEqual(mockPortfolio);
    });

    it("should create portfolio if not exists", async () => {
      mockPrismaService.documentPortfolio.findUnique.mockResolvedValue(null);
      mockPrismaService.documentPortfolio.create.mockResolvedValue({
        id: "new-portfolio",
        userId: mockUserId,
      });

      const result = await service.getOrCreatePortfolio(
        mockUserId,
        mockTenantId,
        "EC0249",
      );

      expect(result.id).toBe("new-portfolio");
    });
  });

  describe("updatePortfolioProgress", () => {
    it("should calculate and update progress", async () => {
      mockPrismaService.document.findMany.mockResolvedValue([
        { ...mockDocument, status: DocumentStatus.APPROVED },
      ]);
      mockPrismaService.documentTemplate.groupBy.mockResolvedValue([
        { element: "E0875", _count: 8 },
        { element: "E0876", _count: 2 },
        { element: "E0877", _count: 5 },
      ]);
      mockPrismaService.documentPortfolio.upsert.mockResolvedValue({
        element1Progress: 13,
        overallProgress: 7,
      });

      const result = await service.updatePortfolioProgress(
        mockUserId,
        mockTenantId,
        "EC0249",
      );

      expect(result.portfolio).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { ECPortfolioService } from "./ec-portfolio.service";
import { PrismaService } from "../../database/prisma.service";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";

describe("ECPortfolioService", () => {
  let service: ECPortfolioService;

  const mockECId = "ec-123";
  const mockEnrollmentId = "enrollment-123";
  const mockTemplateId = "template-123";
  const mockDocumentId = "document-123";
  const mockElementId = "element-123";

  const mockEC = {
    id: mockECId,
    code: "EC0249",
    title: "Test EC",
  };

  const mockElement = {
    id: mockElementId,
    ecId: mockECId,
    code: "E0875",
    title: "Test Element",
  };

  const mockTemplate = {
    id: mockTemplateId,
    ecId: mockECId,
    elementId: mockElementId,
    code: "TPL-001",
    title: "Test Template",
    category: "REQUIRED",
    sections: [
      { id: "intro", title: "Introduction", required: true },
      { id: "content", title: "Content", required: true },
    ],
    _count: { documents: 0 },
  };

  const mockDocument = {
    id: mockDocumentId,
    enrollmentId: mockEnrollmentId,
    templateId: mockTemplateId,
    title: "Test Document",
    status: "DRAFT",
    content: {},
    isComplete: false,
    version: 1,
    template: mockTemplate,
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    ecId: mockECId,
    userId: "user-123",
    ec: {
      ...mockEC,
      elements: [mockElement],
      templates: [mockTemplate],
    },
    documents: [],
  };

  const mockPrismaService = {
    eCStandard: {
      findUnique: jest.fn(),
    },
    eCElement: {
      findUnique: jest.fn(),
    },
    eCTemplate: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eCEnrollment: {
      findUnique: jest.fn(),
    },
    eCDocument: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECPortfolioService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ECPortfolioService>(ECPortfolioService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTemplate", () => {
    it("should create template", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCElement.findUnique.mockResolvedValue(mockElement);
      mockPrismaService.eCTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.eCTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate("EC0249", {
        elementId: mockElementId,
        code: "TPL-001",
        title: "Test Template",
      });

      expect(result).toEqual(mockTemplate);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.createTemplate("INVALID", {
          elementId: mockElementId,
          code: "TPL-001",
          title: "Test",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if element not in EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCElement.findUnique.mockResolvedValue({
        ...mockElement,
        ecId: "other-ec",
      });

      await expect(
        service.createTemplate("EC0249", {
          elementId: mockElementId,
          code: "TPL-001",
          title: "Test",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if code exists", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCElement.findUnique.mockResolvedValue(mockElement);
      mockPrismaService.eCTemplate.findFirst.mockResolvedValue(mockTemplate);

      await expect(
        service.createTemplate("EC0249", {
          elementId: mockElementId,
          code: "TPL-001",
          title: "Test",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findTemplatesByStandard", () => {
    it("should return templates for EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCTemplate.findMany.mockResolvedValue([mockTemplate]);

      const result = await service.findTemplatesByStandard("EC0249", {});

      expect(result).toHaveLength(1);
    });

    it("should filter by element", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCTemplate.findMany.mockResolvedValue([mockTemplate]);

      await service.findTemplatesByStandard("EC0249", {
        elementId: mockElementId,
      });

      expect(mockPrismaService.eCTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ elementId: mockElementId }),
        }),
      );
    });
  });

  describe("createDocument", () => {
    it("should create document from template", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.eCTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.eCDocument.findFirst.mockResolvedValue(null);
      mockPrismaService.eCDocument.create.mockResolvedValue(mockDocument);

      const result = await service.createDocument(mockEnrollmentId, {
        templateId: mockTemplateId,
      });

      expect(result).toEqual(mockDocument);
    });

    it("should throw ConflictException if document exists", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.eCTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.eCDocument.findFirst.mockResolvedValue(mockDocument);

      await expect(
        service.createDocument(mockEnrollmentId, {
          templateId: mockTemplateId,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateDocumentContent", () => {
    it("should update document content", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.eCDocument.update.mockResolvedValue({
        ...mockDocument,
        content: { intro: { sectionId: "intro", value: "Test content" } },
        status: "IN_PROGRESS",
      });

      const result = await service.updateDocumentContent(mockDocumentId, {
        content: { intro: { sectionId: "intro", value: "Test content" } },
      });

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should throw BadRequestException if document approved", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        status: "APPROVED",
      });

      await expect(
        service.updateDocumentContent(mockDocumentId, { content: {} }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("submitDocument", () => {
    it("should submit complete document", async () => {
      const completeDoc = {
        ...mockDocument,
        content: {
          intro: { value: "Complete intro content here" },
          content: { value: "Complete main content here" },
        },
        isComplete: true,
      };
      mockPrismaService.eCDocument.findUnique.mockResolvedValue(completeDoc);
      mockPrismaService.eCDocument.update.mockResolvedValue({
        ...completeDoc,
        status: "SUBMITTED",
      });

      const result = await service.submitDocument(mockDocumentId);

      expect(result.status).toBe("SUBMITTED");
    });

    it("should throw if already submitted", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        status: "SUBMITTED",
      });

      await expect(service.submitDocument(mockDocumentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("approveDocument", () => {
    it("should approve submitted document", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        status: "SUBMITTED",
      });
      mockPrismaService.eCDocument.update.mockResolvedValue({
        ...mockDocument,
        status: "APPROVED",
      });

      const result = await service.approveDocument(mockDocumentId);

      expect(result.status).toBe("APPROVED");
    });

    it("should throw if not submitted", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue(mockDocument);

      await expect(service.approveDocument(mockDocumentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("rejectDocument", () => {
    it("should reject submitted document with reason", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        status: "SUBMITTED",
      });
      mockPrismaService.eCDocument.update.mockResolvedValue({
        ...mockDocument,
        status: "REJECTED",
      });

      const result = await service.rejectDocument(mockDocumentId, "Incomplete");

      expect(result.status).toBe("REJECTED");
    });
  });

  describe("getPortfolioSummary", () => {
    it("should return portfolio summary", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        documents: [{ ...mockDocument, isComplete: true, status: "APPROVED" }],
      });

      const result = await service.getPortfolioSummary(mockEnrollmentId);

      expect(result.enrollmentId).toBe(mockEnrollmentId);
      expect(result.totalDocuments).toBe(1);
      expect(result.completedDocuments).toBe(1);
      expect(result.approvedDocuments).toBe(1);
    });
  });

  describe("initializePortfolio", () => {
    it("should create documents for missing templates", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.eCDocument.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.eCDocument.findMany.mockResolvedValue([mockDocument]);

      const result = await service.initializePortfolio(mockEnrollmentId);

      expect(mockPrismaService.eCDocument.createMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe("validateDocumentContent", () => {
    it("should validate complete content", () => {
      const content = {
        intro: { sectionId: "intro", value: "Complete intro content here" },
        content: { sectionId: "content", value: "Complete main content here" },
      };
      const sections = [
        { id: "intro", title: "Introduction", required: true },
        { id: "content", title: "Content", required: true },
      ];

      const result = service.validateDocumentContent(
        content as any,
        sections as any,
      );

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
    });

    it("should detect missing required sections", () => {
      const content = {
        intro: { sectionId: "intro", value: "Complete intro" },
      };
      const sections = [
        { id: "intro", title: "Introduction", required: true },
        { id: "content", title: "Content", required: true },
      ];

      const result = service.validateDocumentContent(
        content as any,
        sections as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("deleteDocument", () => {
    it("should delete draft document", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.eCDocument.delete.mockResolvedValue({});

      const result = await service.deleteDocument(mockDocumentId);

      expect(result.message).toContain("deleted");
    });

    it("should throw if document approved", async () => {
      mockPrismaService.eCDocument.findUnique.mockResolvedValue({
        ...mockDocument,
        status: "APPROVED",
      });

      await expect(service.deleteDocument(mockDocumentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

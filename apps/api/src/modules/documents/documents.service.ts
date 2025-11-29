import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { DocumentStatus, Prisma } from "@avala/db";
import { DocumentQueryDto, TemplateQueryDto } from "./dto/document-query.dto";

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

export interface CreateDocumentDto {
  templateCode: string;
  title?: string;
}

export interface UpdateDocumentDto {
  title?: string;
  content?: Record<string, any>;
  status?: DocumentStatus;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // DOCUMENT TEMPLATES
  // ============================================

  /**
   * Get all document templates with pagination
   */
  async findAllTemplates(query?: TemplateQueryDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentTemplateWhereInput = {
      ...(query?.element && { element: query.element }),
    };

    const [items, total] = await Promise.all([
      this.prisma.documentTemplate.findMany({
        where,
        orderBy: [{ element: "asc" }, { orderIndex: "asc" }],
        skip,
        take: limit,
      }),
      this.prisma.documentTemplate.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get templates by element (E0875, E0876, E0877)
   */
  async findTemplatesByElement(element: string) {
    return this.prisma.documentTemplate.findMany({
      where: { element },
      orderBy: { orderIndex: "asc" },
    });
  }

  /**
   * Get a single template by code
   */
  async findTemplateByCode(templateCode: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { templateCode },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateCode} not found`);
    }

    return template;
  }

  // ============================================
  // USER DOCUMENTS
  // ============================================

  /**
   * Get all documents for a user with pagination
   */
  async findUserDocuments(
    userId: string,
    tenantId: string,
    query?: DocumentQueryDto,
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      userId,
      tenantId,
      ...(query?.status && { status: query.status }),
      ...(query?.element && {
        template: { element: query.element },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          template: {
            select: {
              templateCode: true,
              title: true,
              element: true,
              icon: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get documents by element
   */
  async findDocumentsByElement(
    element: string,
    userId: string,
    tenantId: string,
  ) {
    return this.prisma.document.findMany({
      where: {
        userId,
        tenantId,
        template: {
          element,
        },
      },
      include: {
        template: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get a single document by ID
   */
  async findDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      include: {
        template: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  /**
   * Create a new document from a template
   */
  async createDocument(
    userId: string,
    tenantId: string,
    dto: CreateDocumentDto,
  ) {
    // Get template
    const template = await this.findTemplateByCode(dto.templateCode);

    // Initialize content from template sections
    const templateSections = (template.sections as any[]) || [];
    const initialContent: Record<string, any> = {};

    templateSections.forEach((section: any) => {
      initialContent[section.id] = {
        value: "",
        subsections: {},
      };
    });

    // Create document
    const document = await this.prisma.document.create({
      data: {
        userId,
        tenantId,
        templateId: template.id,
        title: dto.title || template.title,
        status: DocumentStatus.DRAFT,
        content: initialContent as Prisma.InputJsonValue,
        validationErrors: [],
      },
      include: {
        template: true,
      },
    });

    this.logger.log(
      `User ${userId} created document ${document.id} from template ${dto.templateCode}`,
    );
    return document;
  }

  /**
   * Update document content
   */
  async updateDocument(
    documentId: string,
    userId: string,
    dto: UpdateDocumentDto,
  ) {
    // Verify ownership
    await this.findDocument(documentId, userId);

    // Calculate completion if content provided
    let isComplete = false;
    let validationScore: number | null = null;

    if (dto.content) {
      const sections = Object.values(dto.content);
      const completedSections = sections.filter(
        (s: any) => s.value && s.value.trim().length > 0,
      );
      validationScore =
        sections.length > 0
          ? Math.round((completedSections.length / sections.length) * 100)
          : 0;
      isComplete = validationScore === 100;
    }

    // Update document
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        content: dto.content as Prisma.InputJsonValue | undefined,
        status: dto.status,
        validationScore,
        isComplete,
        lastAutoSavedAt: new Date(),
      },
      include: {
        template: true,
      },
    });

    this.logger.log(`Document ${documentId} updated by user ${userId}`);
    return updated;
  }

  /**
   * Submit document for review
   */
  async submitDocument(documentId: string, userId: string) {
    const document = await this.findDocument(documentId, userId);

    if (
      document.status !== DocumentStatus.DRAFT &&
      document.status !== DocumentStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        "Only draft or in-progress documents can be submitted",
      );
    }

    if (!document.isComplete) {
      throw new BadRequestException(
        "Document must be complete before submission",
      );
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    this.logger.log(`Document ${documentId} submitted for review`);
    return updated;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string) {
    await this.findDocument(documentId, userId); // Verify ownership

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    this.logger.log(`Document ${documentId} deleted by user ${userId}`);
    return { success: true };
  }

  // ============================================
  // DOCUMENT PORTFOLIOS (Progress Tracking)
  // ============================================

  /**
   * Get or create user's document portfolio for an EC
   */
  async getOrCreatePortfolio(
    userId: string,
    tenantId: string,
    ecCode: string = "EC0249",
  ) {
    let portfolio = await this.prisma.documentPortfolio.findUnique({
      where: {
        tenantId_userId_ecCode: {
          tenantId,
          userId,
          ecCode,
        },
      },
    });

    if (!portfolio) {
      portfolio = await this.prisma.documentPortfolio.create({
        data: {
          tenantId,
          userId,
          ecCode,
          element1Progress: 0,
          element2Progress: 0,
          element3Progress: 0,
          overallProgress: 0,
        },
      });
    }

    return portfolio;
  }

  /**
   * Calculate and update portfolio progress
   */
  async updatePortfolioProgress(
    userId: string,
    tenantId: string,
    ecCode: string = "EC0249",
  ) {
    // Get all user documents grouped by element
    const documents = await this.prisma.document.findMany({
      where: { userId, tenantId },
      include: {
        template: {
          select: { element: true },
        },
      },
    });

    // Calculate progress per element
    const elementProgress: Record<
      string,
      { total: number; completed: number }
    > = {
      E0875: { total: 0, completed: 0 },
      E0876: { total: 0, completed: 0 },
      E0877: { total: 0, completed: 0 },
    };

    documents.forEach((doc) => {
      const element = doc.template.element;
      if (element && elementProgress[element]) {
        elementProgress[element].total++;
        if (doc.status === DocumentStatus.APPROVED) {
          elementProgress[element].completed++;
        }
      }
    });

    // Get template counts per element for percentage calculation
    const templateCounts = await this.prisma.documentTemplate.groupBy({
      by: ["element"],
      _count: true,
    });

    const templateCountMap: Record<string, number> = {};
    templateCounts.forEach((tc) => {
      if (tc.element) {
        templateCountMap[tc.element] = tc._count;
      }
    });

    // Calculate percentages
    const e1Total = templateCountMap["E0875"] || 8;
    const e2Total = templateCountMap["E0876"] || 2;
    const e3Total = templateCountMap["E0877"] || 5;

    const element1Progress =
      e1Total > 0
        ? Math.round((elementProgress.E0875.completed / e1Total) * 100)
        : 0;
    const element2Progress =
      e2Total > 0
        ? Math.round((elementProgress.E0876.completed / e2Total) * 100)
        : 0;
    const element3Progress =
      e3Total > 0
        ? Math.round((elementProgress.E0877.completed / e3Total) * 100)
        : 0;

    const totalTemplates = e1Total + e2Total + e3Total;
    const totalCompleted =
      elementProgress.E0875.completed +
      elementProgress.E0876.completed +
      elementProgress.E0877.completed;
    const overallProgress =
      totalTemplates > 0
        ? Math.round((totalCompleted / totalTemplates) * 100)
        : 0;

    const isCertificationReady = overallProgress === 100;

    // Update portfolio
    const portfolio = await this.prisma.documentPortfolio.upsert({
      where: {
        tenantId_userId_ecCode: {
          tenantId,
          userId,
          ecCode,
        },
      },
      update: {
        element1Progress,
        element2Progress,
        element3Progress,
        overallProgress,
        isCertificationReady,
        readinessCheckedAt: new Date(),
      },
      create: {
        tenantId,
        userId,
        ecCode,
        element1Progress,
        element2Progress,
        element3Progress,
        overallProgress,
        isCertificationReady,
      },
    });

    return {
      portfolio,
      breakdown: {
        element1: {
          progress: element1Progress,
          completed: elementProgress.E0875.completed,
          total: e1Total,
        },
        element2: {
          progress: element2Progress,
          completed: elementProgress.E0876.completed,
          total: e2Total,
        },
        element3: {
          progress: element3Progress,
          completed: elementProgress.E0877.completed,
          total: e3Total,
        },
      },
    };
  }
}

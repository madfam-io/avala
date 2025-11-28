import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma, DocumentStatus, DocumentCategory } from "@avala/db";
import {
  CreateECTemplateDto,
  UpdateECTemplateDto,
  ECTemplateQueryDto,
  CreateECDocumentDto,
  SaveDocumentContentDto,
  ECDocumentQueryDto,
  ValidationResultDto,
  ValidationErrorDto,
  SectionContentDto,
  TemplateSectionDto,
} from "./dto/ec-document.dto";

@Injectable()
export class ECPortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // TEMPLATES
  // ============================================

  async createTemplate(ecCode: string, dto: CreateECTemplateDto) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const element = await this.prisma.eCElement.findUnique({
      where: { id: dto.elementId },
    });

    if (!element || element.ecId !== ec.id) {
      throw new BadRequestException(`Element does not belong to ${ecCode}`);
    }

    const existing = await this.prisma.eCTemplate.findFirst({
      where: { ecId: ec.id, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Template with code ${dto.code} already exists in ${ecCode}`,
      );
    }

    return this.prisma.eCTemplate.create({
      data: {
        ecId: ec.id,
        elementId: dto.elementId,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        category: (dto.category as DocumentCategory) || "REQUIRED",
        orderIndex: dto.orderIndex || 0,
        supportVideoId: dto.supportVideoId,
        supportVideoTitle: dto.supportVideoTitle,
        sections: (dto.sections || []) as unknown as object[],
        evaluationCriteria: (dto.evaluationCriteria ||
          []) as unknown as object[],
      },
      include: {
        element: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });
  }

  async findTemplatesByStandard(ecCode: string, query: ECTemplateQueryDto) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const where: Prisma.ECTemplateWhereInput = { ecId: ec.id };

    if (query.elementId) {
      where.elementId = query.elementId;
    }

    if (query.category) {
      where.category = query.category as DocumentCategory;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { titleEn: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.eCTemplate.findMany({
      where,
      include: {
        element: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: [{ element: { orderIndex: "asc" } }, { orderIndex: "asc" }],
    });
  }

  async findTemplateById(templateId: string) {
    const template = await this.prisma.eCTemplate.findUnique({
      where: { id: templateId },
      include: {
        ec: {
          select: {
            code: true,
            title: true,
          },
        },
        element: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    return template;
  }

  async updateTemplate(templateId: string, dto: UpdateECTemplateDto) {
    const template = await this.prisma.eCTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    return this.prisma.eCTemplate.update({
      where: { id: templateId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        category: dto.category as DocumentCategory,
        orderIndex: dto.orderIndex,
        supportVideoId: dto.supportVideoId,
        supportVideoTitle: dto.supportVideoTitle,
        sections: dto.sections as object[] | undefined,
        evaluationCriteria: dto.evaluationCriteria as unknown as
          | object[]
          | undefined,
      },
      include: {
        element: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });
  }

  async deleteTemplate(templateId: string) {
    const template = await this.prisma.eCTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    if (template._count.documents > 0) {
      throw new ConflictException(
        "Cannot delete template with existing documents",
      );
    }

    await this.prisma.eCTemplate.delete({
      where: { id: templateId },
    });

    return { message: "Template deleted successfully" };
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  async createDocument(enrollmentId: string, dto: CreateECDocumentDto) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const template = await this.prisma.eCTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template || template.ecId !== enrollment.ecId) {
      throw new BadRequestException(
        "Template does not belong to the enrolled EC",
      );
    }

    // Check if document already exists
    const existing = await this.prisma.eCDocument.findFirst({
      where: {
        enrollmentId,
        templateId: dto.templateId,
      },
    });

    if (existing) {
      throw new ConflictException("Document for this template already exists");
    }

    return this.prisma.eCDocument.create({
      data: {
        enrollmentId,
        templateId: dto.templateId,
        title: dto.title || template.title,
        status: "DRAFT",
        content: {},
        validationErrors: [],
        isComplete: false,
        version: 1,
      },
      include: {
        template: {
          include: {
            element: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async findDocumentsByEnrollment(
    enrollmentId: string,
    query: ECDocumentQueryDto,
  ) {
    const where: Prisma.ECDocumentWhereInput = { enrollmentId };

    if (query.status) {
      where.status = query.status as DocumentStatus;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.incomplete) {
      where.isComplete = false;
    }

    return this.prisma.eCDocument.findMany({
      where,
      include: {
        template: {
          include: {
            element: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [
        { template: { element: { orderIndex: "asc" } } },
        { template: { orderIndex: "asc" } },
      ],
    });
  }

  async findDocumentById(documentId: string) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
      include: {
        template: {
          include: {
            ec: {
              select: {
                code: true,
                title: true,
              },
            },
            element: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
        enrollment: {
          select: {
            userId: true,
            ecId: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async updateDocumentContent(documentId: string, dto: SaveDocumentContentDto) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
      include: {
        template: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status === "APPROVED") {
      throw new BadRequestException("Cannot edit approved document");
    }

    // Validate and calculate score
    const validation = this.validateDocumentContent(
      dto.content,
      document.template.sections as unknown as TemplateSectionDto[],
    );

    // Determine new status
    let newStatus = document.status;
    if (newStatus === "DRAFT") {
      newStatus = "IN_PROGRESS";
    }
    if (validation.isValid && validation.score === 100) {
      newStatus = "COMPLETED";
    }

    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        content: dto.content as any,
        status: newStatus as DocumentStatus,
        validationScore: validation.score,
        validationErrors: validation.errors as any,
        isComplete: validation.isValid && validation.score >= 100,
        version: { increment: 1 },
      },
      include: {
        template: true,
      },
    });
  }

  async autoSaveDocument(documentId: string, content: Record<string, any>) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status === "APPROVED") {
      return document; // Silent ignore for approved docs
    }

    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        content: content as object,
      },
    });
  }

  async submitDocument(documentId: string) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
      include: {
        template: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status === "SUBMITTED" || document.status === "APPROVED") {
      throw new BadRequestException("Document is already submitted");
    }

    // Validate completeness
    const validation = this.validateDocumentContent(
      document.content as unknown as Record<string, SectionContentDto>,
      document.template.sections as unknown as TemplateSectionDto[],
    );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: "Document is not complete",
        errors: validation.errors,
      });
    }

    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        isComplete: true,
        validationScore: 100,
      },
    });
  }

  async approveDocument(documentId: string) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status !== "SUBMITTED") {
      throw new BadRequestException("Only submitted documents can be approved");
    }

    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        status: "APPROVED",
      },
    });
  }

  async rejectDocument(documentId: string, reason: string) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status !== "SUBMITTED") {
      throw new BadRequestException("Only submitted documents can be rejected");
    }

    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        status: "REJECTED",
        validationErrors: [
          {
            sectionId: "global",
            field: "review",
            message: reason,
            severity: "error",
          },
        ],
      },
    });
  }

  async deleteDocument(documentId: string) {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.status === "APPROVED") {
      throw new BadRequestException("Cannot delete approved document");
    }

    await this.prisma.eCDocument.delete({
      where: { id: documentId },
    });

    return { message: "Document deleted successfully" };
  }

  // ============================================
  // PORTFOLIO MANAGEMENT
  // ============================================

  async getPortfolioSummary(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            elements: {
              orderBy: { orderIndex: "asc" },
            },
            templates: true,
          },
        },
        documents: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const totalDocuments = enrollment.ec.templates.length;
    const completedDocuments = enrollment.documents.filter(
      (d) => d.isComplete,
    ).length;
    const submittedDocuments = enrollment.documents.filter(
      (d) => d.status === "SUBMITTED" || d.status === "APPROVED",
    ).length;
    const approvedDocuments = enrollment.documents.filter(
      (d) => d.status === "APPROVED",
    ).length;

    // Calculate by element
    const byElement = enrollment.ec.elements.map((element) => {
      const elementTemplates = enrollment.ec.templates.filter(
        (t) => t.elementId === element.id,
      );
      const elementDocs = enrollment.documents.filter((d) =>
        elementTemplates.some((t) => t.id === d.templateId),
      );
      const completedDocs = elementDocs.filter((d) => d.isComplete).length;

      return {
        elementId: element.id,
        elementCode: element.code,
        elementTitle: element.title,
        totalTemplates: elementTemplates.length,
        completedDocuments: completedDocs,
        progress:
          elementTemplates.length > 0
            ? Math.round((completedDocs / elementTemplates.length) * 100)
            : 0,
      };
    });

    const overallProgress =
      totalDocuments > 0
        ? Math.round((completedDocuments / totalDocuments) * 100)
        : 0;

    // Check certification readiness (80% of required docs approved)
    const requiredTemplates = enrollment.ec.templates.filter(
      (t) => t.category === "REQUIRED",
    );
    const approvedRequired = enrollment.documents.filter(
      (d) =>
        d.status === "APPROVED" &&
        requiredTemplates.some((t) => t.id === d.templateId),
    ).length;
    const certificationReady =
      requiredTemplates.length > 0 &&
      approvedRequired >= requiredTemplates.length * 0.8;

    return {
      enrollmentId,
      ecCode: enrollment.ec.code,
      totalDocuments,
      completedDocuments,
      submittedDocuments,
      approvedDocuments,
      overallProgress,
      byElement,
      certificationReady,
    };
  }

  async initializePortfolio(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            templates: true,
          },
        },
        documents: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    // Create documents for templates that don't have one yet
    const existingTemplateIds = enrollment.documents.map((d) => d.templateId);
    const missingTemplates = enrollment.ec.templates.filter(
      (t) => !existingTemplateIds.includes(t.id),
    );

    if (missingTemplates.length > 0) {
      await this.prisma.eCDocument.createMany({
        data: missingTemplates.map((template) => ({
          enrollmentId,
          templateId: template.id,
          title: template.title,
          status: "DRAFT" as DocumentStatus,
          content: {},
          validationErrors: [],
          isComplete: false,
          version: 1,
        })),
      });
    }

    return this.findDocumentsByEnrollment(enrollmentId, {});
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateDocumentContent(
    content: Record<string, SectionContentDto>,
    sections: TemplateSectionDto[],
  ): ValidationResultDto {
    const errors: ValidationErrorDto[] = [];
    const warnings: ValidationErrorDto[] = [];
    let completedSections = 0;

    const validateSection = (
      section: TemplateSectionDto,
      sectionContent: SectionContentDto | undefined,
    ) => {
      if (!sectionContent || !sectionContent.value) {
        if (section.required !== false) {
          errors.push({
            sectionId: section.id,
            field: "value",
            message: `${section.title} is required`,
            severity: "error",
          });
        } else {
          warnings.push({
            sectionId: section.id,
            field: "value",
            message: `${section.title} is empty`,
            severity: "warning",
          });
        }
        return false;
      }

      // Check value based on type
      const value = sectionContent.value;
      if (typeof value === "string" && value.trim().length < 10) {
        if (section.required !== false) {
          errors.push({
            sectionId: section.id,
            field: "value",
            message: `${section.title} content is too short`,
            severity: "error",
          });
          return false;
        }
      }

      // Validate subsections
      if (section.subsections && section.subsections.length > 0) {
        for (const subsection of section.subsections) {
          const subsectionContent = sectionContent.subsections?.find(
            (s) => s.sectionId === subsection.id,
          );
          validateSection(subsection, subsectionContent);
        }
      }

      return true;
    };

    for (const section of sections) {
      const sectionContent = content[section.id];
      if (validateSection(section, sectionContent)) {
        completedSections++;
      }
    }

    const score =
      sections.length > 0
        ? Math.round((completedSections / sections.length) * 100)
        : 0;

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      completedSections,
      totalSections: sections.length,
    };
  }

  async validateDocument(documentId: string): Promise<ValidationResultDto> {
    const document = await this.prisma.eCDocument.findUnique({
      where: { id: documentId },
      include: {
        template: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return this.validateDocumentContent(
      document.content as unknown as Record<string, SectionContentDto>,
      document.template.sections as unknown as TemplateSectionDto[],
    );
  }

  // ============================================
  // EXPORT
  // ============================================

  async exportDocument(documentId: string) {
    const document = await this.findDocumentById(documentId);

    if (!document.isComplete) {
      throw new BadRequestException("Can only export complete documents");
    }

    // In a real implementation, this would generate a PDF
    // For now, return the document data formatted for export

    return {
      document,
      exportedAt: new Date(),
      format: "json", // Would be 'pdf' in production
    };
  }

  async markDocumentExported(documentId: string, pdfPath: string) {
    return this.prisma.eCDocument.update({
      where: { id: documentId },
      data: {
        pdfPath,
        exportedAt: new Date(),
      },
    });
  }
}

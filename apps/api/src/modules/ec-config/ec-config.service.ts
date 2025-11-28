import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma, ECStandardStatus } from "@avala/db";
import {
  CreateECStandardDto,
  UpdateECStandardDto,
  ECStandardQueryDto,
  CreateECElementDto,
  UpdateECElementDto,
  CreateECModuleDto,
  UpdateECModuleDto,
  CreateECLessonDto,
  UpdateECLessonDto,
} from "./dto/ec-standard.dto";

@Injectable()
export class ECConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // EC STANDARDS
  // ============================================

  async createStandard(dto: CreateECStandardDto) {
    const existing = await this.prisma.eCStandard.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `EC Standard with code ${dto.code} already exists`,
      );
    }

    return this.prisma.eCStandard.create({
      data: {
        code: dto.code,
        version: dto.version || "01",
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        descriptionEn: dto.descriptionEn,
        issuer: dto.issuer || "CONOCER",
        sector: dto.sector,
        level: dto.level || 3,
        estimatedHours: dto.estimatedHours || 40,
        dc3Eligible: dto.dc3Eligible ?? true,
        thumbnailUrl: dto.thumbnailUrl,
        status: "DRAFT",
      },
      include: {
        _count: {
          select: {
            elements: true,
            modules: true,
            templates: true,
            assessments: true,
            simulations: true,
            enrollments: true,
          },
        },
      },
    });
  }

  async findAllStandards(query: ECStandardQueryDto) {
    const { status, sector, level, search, page = 1, limit = 20 } = query;

    const where: Prisma.ECStandardWhereInput = {};

    if (status) {
      where.status = status as ECStandardStatus;
    }

    if (sector) {
      where.sector = sector;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { titleEn: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.eCStandard.findMany({
        where,
        include: {
          _count: {
            select: {
              elements: true,
              modules: true,
              templates: true,
              assessments: true,
              simulations: true,
              enrollments: true,
            },
          },
        },
        orderBy: { code: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eCStandard.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findStandardByCode(code: string) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code },
      include: {
        elements: {
          orderBy: { orderIndex: "asc" },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
            },
            _count: {
              select: {
                lessons: true,
                assessments: true,
              },
            },
          },
        },
        templates: {
          orderBy: { orderIndex: "asc" },
        },
        assessments: true,
        simulations: true,
        _count: {
          select: {
            elements: true,
            modules: true,
            templates: true,
            assessments: true,
            simulations: true,
            enrollments: true,
          },
        },
      },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${code} not found`);
    }

    return standard;
  }

  async findStandardById(id: string) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { id },
      include: {
        elements: {
          orderBy: { orderIndex: "asc" },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        _count: {
          select: {
            elements: true,
            modules: true,
            templates: true,
            assessments: true,
            simulations: true,
            enrollments: true,
          },
        },
      },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard not found`);
    }

    return standard;
  }

  async updateStandard(code: string, dto: UpdateECStandardDto) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${code} not found`);
    }

    const updateData: Prisma.ECStandardUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.titleEn !== undefined) updateData.titleEn = dto.titleEn;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.descriptionEn !== undefined)
      updateData.descriptionEn = dto.descriptionEn;
    if (dto.issuer !== undefined) updateData.issuer = dto.issuer;
    if (dto.sector !== undefined) updateData.sector = dto.sector;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.estimatedHours !== undefined)
      updateData.estimatedHours = dto.estimatedHours;
    if (dto.dc3Eligible !== undefined) updateData.dc3Eligible = dto.dc3Eligible;
    if (dto.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = dto.thumbnailUrl;
    if (dto.status !== undefined) {
      updateData.status = dto.status as ECStandardStatus;
      if (dto.status === "PUBLISHED" && !standard.publishedAt) {
        updateData.publishedAt = new Date();
      }
      if (dto.status === "DEPRECATED") {
        updateData.deprecatedAt = new Date();
      }
    }

    return this.prisma.eCStandard.update({
      where: { code },
      data: updateData,
      include: {
        _count: {
          select: {
            elements: true,
            modules: true,
            templates: true,
            assessments: true,
            simulations: true,
            enrollments: true,
          },
        },
      },
    });
  }

  async deleteStandard(code: string) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${code} not found`);
    }

    if (standard._count.enrollments > 0) {
      throw new ConflictException(
        `Cannot delete EC Standard with active enrollments. Deprecate instead.`,
      );
    }

    await this.prisma.eCStandard.delete({
      where: { code },
    });

    return { message: `EC Standard ${code} deleted successfully` };
  }

  async publishStandard(code: string) {
    return this.updateStandard(code, { status: "PUBLISHED" });
  }

  async deprecateStandard(code: string) {
    return this.updateStandard(code, { status: "DEPRECATED" });
  }

  // ============================================
  // EC ELEMENTS
  // ============================================

  async createElement(ecCode: string, dto: CreateECElementDto) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${ecCode} not found`);
    }

    const existing = await this.prisma.eCElement.findFirst({
      where: { ecId: standard.id, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Element with code ${dto.code} already exists in ${ecCode}`,
      );
    }

    return this.prisma.eCElement.create({
      data: {
        ecId: standard.id,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        orderIndex: dto.orderIndex || 0,
        requiredDocuments: dto.requiredDocuments || 0,
        requiredScore: dto.requiredScore || 70,
        performanceCriteria: dto.performanceCriteria || [],
        knowledgeCriteria: dto.knowledgeCriteria || [],
        productCriteria: dto.productCriteria || [],
      },
    });
  }

  async findElementsByStandard(ecCode: string) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${ecCode} not found`);
    }

    return this.prisma.eCElement.findMany({
      where: { ecId: standard.id },
      orderBy: { orderIndex: "asc" },
      include: {
        templates: true,
        moduleElements: {
          include: {
            module: true,
          },
        },
      },
    });
  }

  async findElementById(elementId: string) {
    const element = await this.prisma.eCElement.findUnique({
      where: { id: elementId },
      include: {
        ec: true,
        templates: true,
        moduleElements: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!element) {
      throw new NotFoundException(`Element not found`);
    }

    return element;
  }

  async updateElement(elementId: string, dto: UpdateECElementDto) {
    const element = await this.prisma.eCElement.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      throw new NotFoundException(`Element not found`);
    }

    return this.prisma.eCElement.update({
      where: { id: elementId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        orderIndex: dto.orderIndex,
        requiredDocuments: dto.requiredDocuments,
        requiredScore: dto.requiredScore,
        performanceCriteria: dto.performanceCriteria,
        knowledgeCriteria: dto.knowledgeCriteria,
        productCriteria: dto.productCriteria,
      },
    });
  }

  async deleteElement(elementId: string) {
    const element = await this.prisma.eCElement.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      throw new NotFoundException(`Element not found`);
    }

    await this.prisma.eCElement.delete({
      where: { id: elementId },
    });

    return { message: "Element deleted successfully" };
  }

  // ============================================
  // EC MODULES
  // ============================================

  async createModule(ecCode: string, dto: CreateECModuleDto) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${ecCode} not found`);
    }

    const existing = await this.prisma.eCModule.findFirst({
      where: { ecId: standard.id, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Module with code ${dto.code} already exists in ${ecCode}`,
      );
    }

    const module = await this.prisma.eCModule.create({
      data: {
        ecId: standard.id,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        icon: dto.icon,
        orderIndex: dto.orderIndex || 0,
        estimatedMinutes: dto.estimatedMinutes || 60,
        isRequired: dto.isRequired ?? true,
      },
    });

    // Link to elements if provided
    if (dto.elementIds && dto.elementIds.length > 0) {
      await this.prisma.eCModuleElement.createMany({
        data: dto.elementIds.map((elementId) => ({
          moduleId: module.id,
          elementId,
        })),
      });
    }

    return this.findModuleById(module.id);
  }

  async findModulesByStandard(ecCode: string) {
    const standard = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!standard) {
      throw new NotFoundException(`EC Standard with code ${ecCode} not found`);
    }

    return this.prisma.eCModule.findMany({
      where: { ecId: standard.id },
      orderBy: { orderIndex: "asc" },
      include: {
        lessons: {
          orderBy: { orderIndex: "asc" },
        },
        assessments: true,
        elements: {
          include: {
            element: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            assessments: true,
          },
        },
      },
    });
  }

  async findModuleById(moduleId: string) {
    const module = await this.prisma.eCModule.findUnique({
      where: { id: moduleId },
      include: {
        ec: true,
        lessons: {
          orderBy: { orderIndex: "asc" },
        },
        assessments: true,
        elements: {
          include: {
            element: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            assessments: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module not found`);
    }

    return module;
  }

  async updateModule(moduleId: string, dto: UpdateECModuleDto) {
    const module = await this.prisma.eCModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module not found`);
    }

    // Update element links if provided
    if (dto.elementIds !== undefined) {
      // Remove existing links
      await this.prisma.eCModuleElement.deleteMany({
        where: { moduleId },
      });

      // Create new links
      if (dto.elementIds.length > 0) {
        await this.prisma.eCModuleElement.createMany({
          data: dto.elementIds.map((elementId) => ({
            moduleId,
            elementId,
          })),
        });
      }
    }

    return this.prisma.eCModule.update({
      where: { id: moduleId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        icon: dto.icon,
        orderIndex: dto.orderIndex,
        estimatedMinutes: dto.estimatedMinutes,
        isRequired: dto.isRequired,
      },
      include: {
        lessons: {
          orderBy: { orderIndex: "asc" },
        },
        elements: {
          include: {
            element: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            assessments: true,
          },
        },
      },
    });
  }

  async deleteModule(moduleId: string) {
    const module = await this.prisma.eCModule.findUnique({
      where: { id: moduleId },
      include: {
        _count: {
          select: { progress: true },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module not found`);
    }

    if (module._count.progress > 0) {
      throw new ConflictException(
        `Cannot delete module with existing progress records`,
      );
    }

    await this.prisma.eCModule.delete({
      where: { id: moduleId },
    });

    return { message: "Module deleted successfully" };
  }

  // ============================================
  // EC LESSONS
  // ============================================

  async createLesson(moduleId: string, dto: CreateECLessonDto) {
    const module = await this.prisma.eCModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module not found`);
    }

    const existing = await this.prisma.eCLesson.findFirst({
      where: { moduleId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Lesson with code ${dto.code} already exists in this module`,
      );
    }

    return this.prisma.eCLesson.create({
      data: {
        moduleId,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        orderIndex: dto.orderIndex || 0,
        sections: (dto.sections || []) as object[],
        videoId: dto.videoId,
        videoDuration: dto.videoDuration,
        estimatedMinutes: dto.estimatedMinutes || 15,
        isRequired: dto.isRequired ?? true,
      },
    });
  }

  async findLessonsByModule(moduleId: string) {
    const module = await this.prisma.eCModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module not found`);
    }

    return this.prisma.eCLesson.findMany({
      where: { moduleId },
      orderBy: { orderIndex: "asc" },
    });
  }

  async findLessonById(lessonId: string) {
    const lesson = await this.prisma.eCLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            ec: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson not found`);
    }

    return lesson;
  }

  async updateLesson(lessonId: string, dto: UpdateECLessonDto) {
    const lesson = await this.prisma.eCLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson not found`);
    }

    return this.prisma.eCLesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        orderIndex: dto.orderIndex,
        sections: dto.sections as object[] | undefined,
        videoId: dto.videoId,
        videoDuration: dto.videoDuration,
        estimatedMinutes: dto.estimatedMinutes,
        isRequired: dto.isRequired,
      },
    });
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.eCLesson.findUnique({
      where: { id: lessonId },
      include: {
        _count: {
          select: { progress: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson not found`);
    }

    if (lesson._count.progress > 0) {
      throw new ConflictException(
        `Cannot delete lesson with existing progress records`,
      );
    }

    await this.prisma.eCLesson.delete({
      where: { id: lessonId },
    });

    return { message: "Lesson deleted successfully" };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getStandardOverview(code: string) {
    const standard = await this.findStandardByCode(code);

    // Calculate totals
    const totalLessons = standard.modules.reduce(
      (acc, m) => acc + m.lessons.length,
      0,
    );
    const totalMinutes = standard.modules.reduce(
      (acc, m) => acc + m.estimatedMinutes,
      0,
    );

    return {
      ...standard,
      overview: {
        totalElements: standard.elements.length,
        totalModules: standard.modules.length,
        totalLessons,
        totalTemplates: standard.templates.length,
        totalAssessments: standard.assessments.length,
        totalSimulations: standard.simulations.length,
        totalEnrollments: standard._count.enrollments,
        estimatedMinutes: totalMinutes,
        estimatedHours: Math.round(totalMinutes / 60),
      },
    };
  }

  async cloneStandard(sourceCode: string, newCode: string, newTitle: string) {
    const source = await this.findStandardByCode(sourceCode);

    // Create new standard
    const newStandard = await this.prisma.eCStandard.create({
      data: {
        code: newCode,
        version: "01",
        title: newTitle,
        titleEn: source.titleEn ? `${source.titleEn} (Clone)` : undefined,
        description: source.description,
        descriptionEn: source.descriptionEn,
        issuer: source.issuer,
        sector: source.sector,
        level: source.level,
        estimatedHours: source.estimatedHours,
        dc3Eligible: source.dc3Eligible,
        status: "DRAFT",
      },
    });

    // Clone elements
    const elementMap = new Map<string, string>();
    for (const element of source.elements) {
      const newElement = await this.prisma.eCElement.create({
        data: {
          ecId: newStandard.id,
          code: element.code,
          title: element.title,
          titleEn: element.titleEn,
          description: element.description,
          orderIndex: element.orderIndex,
          requiredDocuments: element.requiredDocuments,
          requiredScore: element.requiredScore,
          performanceCriteria: element.performanceCriteria as any,
          knowledgeCriteria: element.knowledgeCriteria as any,
          productCriteria: element.productCriteria as any,
        },
      });
      elementMap.set(element.id, newElement.id);
    }

    // Clone modules and lessons
    for (const module of source.modules) {
      const newModule = await this.prisma.eCModule.create({
        data: {
          ecId: newStandard.id,
          code: module.code,
          title: module.title,
          titleEn: module.titleEn,
          description: module.description,
          icon: module.icon,
          orderIndex: module.orderIndex,
          estimatedMinutes: module.estimatedMinutes,
          isRequired: module.isRequired,
        },
      });

      // Clone lessons
      for (const lesson of module.lessons) {
        await this.prisma.eCLesson.create({
          data: {
            moduleId: newModule.id,
            code: lesson.code,
            title: lesson.title,
            titleEn: lesson.titleEn,
            orderIndex: lesson.orderIndex,
            sections: lesson.sections as any,
            videoId: lesson.videoId,
            videoDuration: lesson.videoDuration,
            estimatedMinutes: lesson.estimatedMinutes,
            isRequired: lesson.isRequired,
          },
        });
      }
    }

    return this.findStandardByCode(newCode);
  }
}

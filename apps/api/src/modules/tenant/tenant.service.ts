import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Tenant, Prisma, Plan } from "@avala/db";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantQueryDto } from "./dto/tenant-query.dto";

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  totalCertificates: number;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  /**
   * List all tenants with pagination and filtering
   */
  async findAll(query: TenantQueryDto): Promise<PaginatedResult<Tenant>> {
    const {
      search,
      status,
      plan,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status as unknown as Prisma.EnumTenantStatusFilter;
    }
    if (plan) {
      where.plan = plan as unknown as Prisma.EnumPlanFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              users: true,
              courses: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new tenant with admin user
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Check for slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException(
        `Tenant with slug '${dto.slug}' already exists`,
      );
    }

    // Check for admin email uniqueness across all tenants
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email '${dto.adminEmail}' already exists`,
      );
    }

    // Create tenant with admin user in a transaction
    const tenant = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          plan: (dto.plan as Plan) ?? Plan.BASIC,
          status: "ACTIVE",
          settings: dto.settings ? (dto.settings as Prisma.JsonObject) : {},
          rfc: dto.rfc,
          legalName: dto.legalName,
        },
      });

      // Create admin user for the tenant
      await tx.user.create({
        data: {
          email: dto.adminEmail,
          firstName: dto.adminFirstName ?? "",
          lastName: dto.adminLastName ?? "",
          role: "ADMIN",
          tenantId: newTenant.id,
          emailVerified: false,
        },
      });

      this.logger.log(
        `Created tenant '${newTenant.slug}' with admin '${dto.adminEmail}'`,
      );

      return newTenant;
    });

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    // Verify tenant exists
    await this.findById(id);

    const updateData: Prisma.TenantUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.plan) updateData.plan = dto.plan as Plan;
    if (dto.status)
      updateData.status =
        dto.status as Prisma.EnumTenantStatusFieldUpdateOperationsInput["set"];
    if (dto.settings) updateData.settings = dto.settings as Prisma.JsonObject;
    if (dto.rfc) updateData.rfc = dto.rfc;
    if (dto.legalName) updateData.legalName = dto.legalName;

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    this.logger.log(`Updated tenant '${tenant.slug}'`);

    return tenant;
  }

  /**
   * Update tenant settings
   */
  async updateSettings(
    id: string,
    settings: Record<string, any>,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);

    const mergedSettings = {
      ...((tenant.settings as Record<string, any>) ?? {}),
      ...settings,
    };

    return this.prisma.tenant.update({
      where: { id },
      data: { settings: mergedSettings as Prisma.JsonObject },
    });
  }

  /**
   * Soft delete tenant (set status to CANCELLED)
   */
  async delete(id: string): Promise<Tenant> {
    await this.findById(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    this.logger.log(`Soft deleted tenant '${tenant.slug}'`);

    return tenant;
  }

  /**
   * Hard delete tenant (use with caution - removes all data)
   */
  async hardDelete(id: string): Promise<void> {
    const tenant = await this.findById(id);

    if (tenant.status !== "CANCELLED") {
      throw new BadRequestException(
        "Tenant must be cancelled before hard deletion",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Get user IDs in this tenant for cleanup
      const tenantUsers = await tx.user.findMany({
        where: { tenantId: id },
        select: { id: true },
      });
      const userIds = tenantUsers.map((u) => u.id);

      // Delete in dependency order
      await tx.userAchievement.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.userStreak.deleteMany({ where: { userId: { in: userIds } } });
      await tx.quizAttempt.deleteMany({ where: { userId: { in: userIds } } });
      await tx.lessonProgress.deleteMany({
        where: { enrollment: { userId: { in: userIds } } },
      });
      await tx.courseEnrollment.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.enrollment.deleteMany({ where: { traineeId: { in: userIds } } });
      await tx.userToken.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { tenantId: id } });
      await tx.course.deleteMany({ where: { tenantId: id } });
      await tx.tenant.delete({ where: { id } });
    });

    this.logger.warn(
      `Hard deleted tenant '${tenant.slug}' and all associated data`,
    );
  }

  /**
   * Suspend tenant
   */
  async suspend(id: string, reason?: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status === "SUSPENDED") {
      throw new BadRequestException("Tenant is already suspended");
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        settings: {
          ...((tenant.settings as Record<string, any>) ?? {}),
          suspendedAt: new Date().toISOString(),
          suspendedReason: reason,
        } as Prisma.JsonObject,
      },
    });

    this.logger.warn(
      `Suspended tenant '${tenant.slug}': ${reason ?? "No reason provided"}`,
    );

    return updatedTenant;
  }

  /**
   * Reactivate tenant
   */
  async reactivate(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status !== "SUSPENDED") {
      throw new BadRequestException("Tenant is not suspended");
    }

    const settings = (tenant.settings as Record<string, any>) ?? {};
    delete settings.suspendedAt;
    delete settings.suspendedReason;

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: "ACTIVE",
        settings: settings as Prisma.JsonObject,
      },
    });

    this.logger.log(`Reactivated tenant '${tenant.slug}'`);

    return updatedTenant;
  }

  /**
   * Get tenant statistics
   */
  async getStats(id: string): Promise<TenantStats> {
    await this.findById(id);

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.user.count({
        where: {
          tenantId: id,
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.course.count({ where: { tenantId: id } }),
      this.prisma.enrollment.count({ where: { trainee: { tenantId: id } } }),
      this.prisma.enrollment.count({
        where: { trainee: { tenantId: id }, status: "COMPLETED" },
      }),
      this.prisma.certificate.count({
        where: { enrollment: { user: { tenantId: id } } },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
    };
  }

  /**
   * Check if tenant has reached plan limits
   */
  async checkPlanLimits(
    id: string,
  ): Promise<{ withinLimits: boolean; limits: Record<string, any> }> {
    const tenant = await this.findById(id);
    const stats = await this.getStats(id);

    const planLimits: Record<string, { users: number; courses: number }> = {
      FREE: { users: 10, courses: 3 },
      BASIC: { users: 50, courses: 20 },
      PROFESSIONAL: { users: 500, courses: 100 },
      ENTERPRISE: { users: -1, courses: -1 }, // Unlimited
    };

    const limits = planLimits[tenant.plan] ?? planLimits.FREE;
    const withinLimits =
      (limits.users === -1 || stats.totalUsers <= limits.users) &&
      (limits.courses === -1 || stats.totalCourses <= limits.courses);

    return {
      withinLimits,
      limits: {
        maxUsers: limits.users === -1 ? "Unlimited" : limits.users,
        currentUsers: stats.totalUsers,
        maxCourses: limits.courses === -1 ? "Unlimited" : limits.courses,
        currentCourses: stats.totalCourses,
      },
    };
  }
}

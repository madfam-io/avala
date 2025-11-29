import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, Prisma, Role } from "@avala/db";
import * as bcrypt from "bcrypt";
import { MailService } from "../mail/mail.service";

export interface PaginatedUsers {
  data: Partial<User>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  role?: Role;
  status?: string;
  search?: string;
}

/**
 * UserService
 * Demonstrates Repository Pattern with Tenant Isolation
 * All queries automatically scoped to tenantId
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Find all users for a tenant with pagination
   * Uses tenant-scoped client for automatic RLS
   */
  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<PaginatedUsers> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const { page = 1, limit = 10, role, status, search } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { curp: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await tenantClient.user.count({ where });

    // Get paginated data
    const data = await tenantClient.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        curp: true,
        rfc: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Exclude sensitive fields
        passwordHash: false,
        ssoSubject: false,
        ssoProvider: false,
      },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find user by ID (tenant-scoped)
   */
  async findById(tenantId: string, userId: string): Promise<User> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const user = await tenantClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Find user by email (tenant-scoped)
   */
  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });
  }

  /**
   * Find users by role (tenant-scoped)
   */
  async findByRole(tenantId: string, role: Role): Promise<User[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.user.findMany({
      where: { role },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create user (tenant-scoped) with password hashing
   */
  async create(
    tenantId: string,
    data: {
      email: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role: Role;
      curp?: string;
      rfc?: string;
      status?: string;
    },
  ): Promise<Partial<User>> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Check if email already exists
    const existingUser = await this.findByEmail(tenantId, data.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Check if CURP already exists (if provided)
    if (data.curp) {
      const existingCurp = await tenantClient.user.findUnique({
        where: { curp: data.curp },
      });
      if (existingCurp) {
        throw new ConflictException("User with this CURP already exists");
      }
    }

    // Hash password if provided, otherwise generate a random one
    const password = data.password || this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await tenantClient.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        curp: data.curp,
        rfc: data.rfc,
        status: (data.status as any) || "ACTIVE",
        tenant: {
          connect: { id: tenantId },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        curp: true,
        rfc: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        passwordHash: false,
        tenantId: true,
        ssoSubject: false,
        ssoProvider: false,
        metadata: false,
      },
    });

    // Send welcome email (Phase 5: Production Readiness)
    try {
      // Get tenant name
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      await this.mailService.sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName || "Usuario",
        tenantName: tenant?.name || "AVALA LMS",
      });
    } catch (error) {
      // Log email error but don't fail user creation
      this.logger.error("Failed to send welcome email", error);
    }

    return user;
  }

  /**
   * Generate random password
   */
  private generateRandomPassword(): string {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Update user (tenant-scoped)
   */
  async update(
    tenantId: string,
    userId: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    const tenantClient = this.prisma.forTenant(tenantId);

    try {
      return await tenantClient.user.update({
        where: { id: userId },
        data,
      });
    } catch (_error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  /**
   * Delete user (tenant-scoped soft delete)
   */
  async delete(tenantId: string, userId: string): Promise<User> {
    return this.update(tenantId, userId, { status: "INACTIVE" });
  }

  /**
   * Count users by role (tenant-scoped)
   */
  async countByRole(tenantId: string): Promise<Record<Role, number>> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const counts = await tenantClient.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const result: any = {};
    counts.forEach((item) => {
      result[item.role] = item._count;
    });

    return result;
  }
}

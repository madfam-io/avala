import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User, Prisma, Role } from '@avala/db';

/**
 * UserService
 * Demonstrates Repository Pattern with Tenant Isolation
 * All queries automatically scoped to tenantId
 */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all users for a tenant
   * Uses tenant-scoped client for automatic RLS
   */
  async findAll(tenantId: string): Promise<User[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create user (tenant-scoped)
   */
  async create(
    tenantId: string,
    data: Omit<Prisma.UserCreateInput, 'tenant'>,
  ): Promise<User> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.user.create({
      data: {
        ...data,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
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
    } catch (error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  /**
   * Delete user (tenant-scoped soft delete)
   */
  async delete(tenantId: string, userId: string): Promise<User> {
    return this.update(tenantId, userId, { status: 'INACTIVE' });
  }

  /**
   * Count users by role (tenant-scoped)
   */
  async countByRole(tenantId: string): Promise<Record<Role, number>> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const counts = await tenantClient.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const result: any = {};
    counts.forEach((item) => {
      result[item.role] = item._count;
    });

    return result;
  }
}

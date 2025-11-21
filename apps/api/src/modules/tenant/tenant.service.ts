import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Tenant, Prisma } from '@avala/db';

/**
 * TenantService
 * Demonstrates Repository Pattern for Tenant management
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
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
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  /**
   * List all tenants (admin only)
   */
  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new tenant
   */
  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data,
    });
  }

  /**
   * Update tenant
   */
  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    try {
      return await this.prisma.tenant.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
  }

  /**
   * Delete tenant (soft delete by setting status)
   */
  async delete(id: string): Promise<Tenant> {
    return this.update(id, { status: 'CANCELLED' });
  }
}

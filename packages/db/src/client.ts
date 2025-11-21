import { PrismaClient } from '@prisma/client';

// Global singleton pattern for Prisma Client
// Prevents multiple instances in development (hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Tenant-scoped Prisma client extension
 * Automatically adds tenantId to all queries for RLS
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      // Apply tenant filter to all models that have tenantId
      $allModels: {
        async findFirst({ args, query, model }: any) {
          // Check if model has tenantId field
          if ('tenantId' in args.where || model === 'Tenant') {
            return query(args);
          }

          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findMany({ args, query, model }: any) {
          if (model === 'Tenant') {
            return query(args);
          }

          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query, model }: any) {
          if (model === 'Tenant') {
            return query(args);
          }

          // For unique queries, we validate tenantId after fetch
          const result = await query(args);
          if (result && result.tenantId !== tenantId) {
            throw new Error('Access denied: Resource belongs to different tenant');
          }
          return result;
        },
        async create({ args, query, model }: any) {
          if (model === 'Tenant') {
            return query(args);
          }

          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query, model }: any) {
          if (model === 'Tenant') {
            return query(args);
          }

          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ args, query, model }: any) {
          if (model === 'Tenant') {
            return query(args);
          }

          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantClient>;

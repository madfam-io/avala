import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, createTenantClient } from '@avala/db';

/**
 * PrismaService - Singleton Prisma client with lifecycle hooks
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✓ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('✓ Database disconnected');
  }

  /**
   * Create a tenant-scoped Prisma client
   * Automatically filters all queries by tenantId
   */
  forTenant(tenantId: string) {
    return createTenantClient(tenantId);
  }

  /**
   * Enable shutdown hooks for graceful shutdown
   */
  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

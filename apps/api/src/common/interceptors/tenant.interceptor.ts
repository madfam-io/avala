import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * TenantInterceptor
 * Logs tenant context for all requests
 * Can be extended for tenant-specific metrics/monitoring
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || 'unknown';
    const method = request.method;
    const url = request.url;

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.debug(
          `[Tenant: ${tenantId}] ${method} ${url} - ${duration}ms`,
        );
      }),
    );
  }
}

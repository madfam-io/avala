import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * TenantGuard
 * Ensures all requests have a valid tenant context
 * In production, this would verify tenant from JWT token
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // For now, check header (in production: validate JWT)
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new UnauthorizedException(
        'Tenant ID required. Include X-Tenant-Id header.',
      );
    }

    // Attach to request for downstream use
    request.tenantId = tenantId;

    return true;
  }
}

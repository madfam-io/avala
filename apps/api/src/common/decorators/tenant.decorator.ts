import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * @TenantId() decorator
 * Extracts tenantId from request context
 * Usage: getTenants(@TenantId() tenantId: string)
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // For now, get from header (later: from JWT token)
    // In production, this would be extracted from authenticated user context
    const tenantId = request.headers["x-tenant-id"] || request.user?.tenantId;

    if (!tenantId) {
      throw new Error("Tenant ID not found in request");
    }

    return tenantId;
  },
);

/**
 * @CurrentUser() decorator
 * Extracts user from request context
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * @CurrentUserId() decorator
 * Extracts userId from request context
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new Error("User ID not found in request");
    }

    return userId;
  },
);

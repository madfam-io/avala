import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { TenantGuard } from "./tenant.guard";

describe("TenantGuard", () => {
  let guard: TenantGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    const createMockContext = (headers: Record<string, string> = {}) => {
      const request = { headers, tenantId: undefined };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getRequest: () => request,
      } as unknown as ExecutionContext;
    };

    it("should return true when X-Tenant-Id header is present", () => {
      const context = createMockContext({ "x-tenant-id": "tenant-123" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should attach tenantId to request", () => {
      const context = createMockContext({ "x-tenant-id": "tenant-123" });
      const request = context.switchToHttp().getRequest();

      guard.canActivate(context);

      expect(request.tenantId).toBe("tenant-123");
    });

    it("should throw UnauthorizedException when X-Tenant-Id is missing", () => {
      const context = createMockContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        "Tenant ID required. Include X-Tenant-Id header."
      );
    });

    it("should throw UnauthorizedException when X-Tenant-Id is empty", () => {
      const context = createMockContext({ "x-tenant-id": "" });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});

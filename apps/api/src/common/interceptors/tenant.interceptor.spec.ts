import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of } from "rxjs";
import { TenantInterceptor } from "./tenant.interceptor";

describe("TenantInterceptor", () => {
  let interceptor: TenantInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantInterceptor],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    const createMockContext = (
      tenantId?: string,
      method = "GET",
      url = "/test"
    ) => {
      const headers = tenantId ? { "x-tenant-id": tenantId } : {};
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            headers,
            method,
            url,
          }),
        }),
      } as unknown as ExecutionContext;
    };

    const createMockCallHandler = (response: any = { data: "test" }) => {
      return {
        handle: () => of(response),
      } as CallHandler;
    };

    it("should pass through and return response", (done) => {
      const context = createMockContext("tenant-123");
      const handler = createMockCallHandler({ data: "test" });

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toEqual({ data: "test" });
          done();
        },
      });
    });

    it("should work without tenant ID header", (done) => {
      const context = createMockContext(undefined);
      const handler = createMockCallHandler({ success: true });

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toEqual({ success: true });
          done();
        },
      });
    });

    it("should handle different HTTP methods", (done) => {
      const context = createMockContext("tenant-123", "POST", "/api/users");
      const handler = createMockCallHandler({ created: true });

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toEqual({ created: true });
          done();
        },
      });
    });

    it("should complete the observable", (done) => {
      const context = createMockContext("tenant-123");
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        complete: () => {
          done();
        },
      });
    });
  });
});

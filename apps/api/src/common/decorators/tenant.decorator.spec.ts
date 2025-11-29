import { ExecutionContext } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { TenantId, CurrentUser, CurrentUserId } from "./tenant.decorator";

// Helper to get the factory function from param decorator
function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() value: unknown) {
      return value;
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, "test");
  return args[Object.keys(args)[0]].factory;
}

describe("Tenant Decorators", () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Record<string, unknown>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: null,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  });

  describe("TenantId", () => {
    it("should extract tenantId from x-tenant-id header", () => {
      mockRequest.headers = { "x-tenant-id": "tenant-123" };

      const factory = getParamDecoratorFactory(TenantId);
      const result = factory(null, mockExecutionContext);

      expect(result).toBe("tenant-123");
    });

    it("should extract tenantId from user context", () => {
      mockRequest.user = { tenantId: "tenant-456" };

      const factory = getParamDecoratorFactory(TenantId);
      const result = factory(null, mockExecutionContext);

      expect(result).toBe("tenant-456");
    });

    it("should prefer header over user context", () => {
      mockRequest.headers = { "x-tenant-id": "header-tenant" };
      mockRequest.user = { tenantId: "user-tenant" };

      const factory = getParamDecoratorFactory(TenantId);
      const result = factory(null, mockExecutionContext);

      expect(result).toBe("header-tenant");
    });

    it("should throw error when tenantId is not found", () => {
      mockRequest.headers = {};
      mockRequest.user = null;

      const factory = getParamDecoratorFactory(TenantId);

      expect(() => factory(null, mockExecutionContext)).toThrow(
        "Tenant ID not found in request",
      );
    });

    it("should throw error when user exists but has no tenantId", () => {
      mockRequest.headers = {};
      mockRequest.user = { id: "user-123" };

      const factory = getParamDecoratorFactory(TenantId);

      expect(() => factory(null, mockExecutionContext)).toThrow(
        "Tenant ID not found in request",
      );
    });
  });

  describe("CurrentUser", () => {
    it("should extract user from request context", () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        tenantId: "tenant-456",
      };
      mockRequest.user = mockUser;

      const factory = getParamDecoratorFactory(CurrentUser);
      const result = factory(null, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });

    it("should return undefined when user is not set", () => {
      mockRequest.user = undefined;

      const factory = getParamDecoratorFactory(CurrentUser);
      const result = factory(null, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it("should return null when user is explicitly null", () => {
      mockRequest.user = null;

      const factory = getParamDecoratorFactory(CurrentUser);
      const result = factory(null, mockExecutionContext);

      expect(result).toBeNull();
    });

    it("should return complete user object with all properties", () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "admin",
        tenantId: "tenant-456",
      };
      mockRequest.user = mockUser;

      const factory = getParamDecoratorFactory(CurrentUser);
      const result = factory(null, mockExecutionContext);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe("user-123");
      expect(result.email).toBe("test@example.com");
      expect(result.role).toBe("admin");
    });
  });

  describe("CurrentUserId", () => {
    it("should extract userId from request context", () => {
      mockRequest.user = { id: "user-789" };

      const factory = getParamDecoratorFactory(CurrentUserId);
      const result = factory(null, mockExecutionContext);

      expect(result).toBe("user-789");
    });

    it("should throw error when user is not set", () => {
      mockRequest.user = undefined;

      const factory = getParamDecoratorFactory(CurrentUserId);

      expect(() => factory(null, mockExecutionContext)).toThrow(
        "User ID not found in request",
      );
    });

    it("should throw error when user exists but has no id", () => {
      mockRequest.user = { email: "test@example.com" };

      const factory = getParamDecoratorFactory(CurrentUserId);

      expect(() => factory(null, mockExecutionContext)).toThrow(
        "User ID not found in request",
      );
    });

    it("should throw error when user is null", () => {
      mockRequest.user = null;

      const factory = getParamDecoratorFactory(CurrentUserId);

      expect(() => factory(null, mockExecutionContext)).toThrow(
        "User ID not found in request",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string tenantId in header", () => {
      mockRequest.headers = { "x-tenant-id": "" };

      const factory = getParamDecoratorFactory(TenantId);

      // Empty string is falsy, so it should throw
      expect(() => factory(null, mockExecutionContext)).toThrow(
        "Tenant ID not found in request",
      );
    });

    it("should handle empty string userId", () => {
      mockRequest.user = { id: "" };

      const factory = getParamDecoratorFactory(CurrentUserId);

      // Empty string is falsy, so it should throw
      expect(() => factory(null, mockExecutionContext)).toThrow(
        "User ID not found in request",
      );
    });
  });
});

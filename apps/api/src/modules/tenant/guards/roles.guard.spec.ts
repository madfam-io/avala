import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard, UserRole } from "./roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockContext = (user?: { role?: string }) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when no roles are required", () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const context = createMockContext({ role: "USER" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when required roles is empty array", () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockContext({ role: "USER" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when user has exact required role", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.INSTRUCTOR]);
      const context = createMockContext({ role: "INSTRUCTOR" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when user has higher role in hierarchy", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);
      const context = createMockContext({ role: "SUPER_ADMIN" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when TENANT_ADMIN accesses MANAGER route", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.MANAGER]);
      const context = createMockContext({ role: "TENANT_ADMIN" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when user role is insufficient", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.TENANT_ADMIN]);
      const context = createMockContext({ role: "USER" });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "Insufficient permissions. Required: TENANT_ADMIN"
      );
    });

    it("should throw ForbiddenException when user is missing", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);
      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("User role not found");
    });

    it("should throw ForbiddenException when user role is missing", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);
      const context = createMockContext({ role: undefined });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("should handle multiple required roles (OR logic)", () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.INSTRUCTOR,
        UserRole.MANAGER,
      ]);
      const context = createMockContext({ role: "INSTRUCTOR" });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should include all required roles in error message", () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.TENANT_ADMIN,
        UserRole.SUPER_ADMIN,
      ]);
      const context = createMockContext({ role: "USER" });

      expect(() => guard.canActivate(context)).toThrow(
        "Insufficient permissions. Required: TENANT_ADMIN or SUPER_ADMIN"
      );
    });

    it("should handle unknown role with 0 level", () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);
      const context = createMockContext({ role: "UNKNOWN_ROLE" });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});

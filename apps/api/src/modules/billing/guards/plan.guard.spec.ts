import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  PlanGuard,
  FeatureGuard,
  LearnerLimitGuard,
  CourseLimitGuard,
  DC3LimitGuard,
} from "./plan.guard";
import { BillingService } from "../billing.service";

describe("PlanGuard", () => {
  let guard: PlanGuard;
  let reflector: jest.Mocked<Reflector>;
  let billingService: jest.Mocked<BillingService>;

  const mockBillingService = {
    getTenantPlan: jest.fn(),
    hasFeature: jest.fn(),
    enforceLearnerLimit: jest.fn(),
    enforceCourseLimit: jest.fn(),
    enforceDC3Limit: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockContext = (tenantId?: string, user?: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId,
          user,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    guard = module.get<PlanGuard>(PlanGuard);
    reflector = module.get(Reflector);
    billingService = module.get(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when no required plan is specified", async () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when tenant plan meets requirement", async () => {
      reflector.getAllAndOverride.mockReturnValue("professional");
      billingService.getTenantPlan.mockResolvedValue("enterprise");
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when tenant plan equals requirement", async () => {
      reflector.getAllAndOverride.mockReturnValue("professional");
      billingService.getTenantPlan.mockResolvedValue("professional");
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when tenant plan is insufficient", async () => {
      reflector.getAllAndOverride.mockReturnValue("enterprise");
      billingService.getTenantPlan.mockResolvedValue("basic");
      const context = createMockContext("tenant-1");

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        "This feature requires enterprise plan or higher. Current plan: basic",
      );
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      reflector.getAllAndOverride.mockReturnValue("professional");
      const context = createMockContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Tenant context required",
      );
    });

    it("should use tenantId from user when request.tenantId is not set", async () => {
      reflector.getAllAndOverride.mockReturnValue("basic");
      billingService.getTenantPlan.mockResolvedValue("professional");
      const context = createMockContext(undefined, {
        tenantId: "tenant-from-user",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.getTenantPlan).toHaveBeenCalledWith(
        "tenant-from-user",
      );
    });
  });
});

describe("FeatureGuard", () => {
  let guard: FeatureGuard;
  let reflector: jest.Mocked<Reflector>;
  let billingService: jest.Mocked<BillingService>;

  const mockBillingService = {
    hasFeature: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockContext = (tenantId?: string, user?: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId,
          user,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    guard = module.get<FeatureGuard>(FeatureGuard);
    reflector = module.get(Reflector);
    billingService = module.get(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when no required feature is specified", async () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should return true when tenant has required feature", async () => {
      reflector.getAllAndOverride.mockReturnValue("advanced_analytics");
      billingService.hasFeature.mockResolvedValue(true);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.hasFeature).toHaveBeenCalledWith(
        "tenant-1",
        "advanced_analytics",
      );
    });

    it("should throw ForbiddenException when tenant lacks feature", async () => {
      reflector.getAllAndOverride.mockReturnValue("advanced_analytics");
      billingService.hasFeature.mockResolvedValue(false);
      const context = createMockContext("tenant-1");

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Feature 'advanced_analytics' is not available on your current plan",
      );
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      reflector.getAllAndOverride.mockReturnValue("some_feature");
      const context = createMockContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

describe("LearnerLimitGuard", () => {
  let guard: LearnerLimitGuard;
  let billingService: jest.Mocked<BillingService>;

  const mockBillingService = {
    enforceLearnerLimit: jest.fn(),
  };

  const createMockContext = (tenantId?: string, user?: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId,
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnerLimitGuard,
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    guard = module.get<LearnerLimitGuard>(LearnerLimitGuard);
    billingService = module.get(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when under learner limit", async () => {
      billingService.enforceLearnerLimit.mockResolvedValue(undefined);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.enforceLearnerLimit).toHaveBeenCalledWith(
        "tenant-1",
      );
    });

    it("should throw when learner limit exceeded", async () => {
      billingService.enforceLearnerLimit.mockRejectedValue(
        new ForbiddenException("Learner limit reached"),
      );
      const context = createMockContext("tenant-1");

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      const context = createMockContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

describe("CourseLimitGuard", () => {
  let guard: CourseLimitGuard;
  let billingService: jest.Mocked<BillingService>;

  const mockBillingService = {
    enforceCourseLimit: jest.fn(),
  };

  const createMockContext = (tenantId?: string, user?: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId,
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseLimitGuard,
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    guard = module.get<CourseLimitGuard>(CourseLimitGuard);
    billingService = module.get(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when under course limit", async () => {
      billingService.enforceCourseLimit.mockResolvedValue(undefined);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.enforceCourseLimit).toHaveBeenCalledWith(
        "tenant-1",
      );
    });

    it("should throw when course limit exceeded", async () => {
      billingService.enforceCourseLimit.mockRejectedValue(
        new ForbiddenException("Course limit reached"),
      );
      const context = createMockContext("tenant-1");

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      const context = createMockContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

describe("DC3LimitGuard", () => {
  let guard: DC3LimitGuard;
  let billingService: jest.Mocked<BillingService>;

  const mockBillingService = {
    enforceDC3Limit: jest.fn(),
  };

  const createMockContext = (tenantId?: string, user?: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId,
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DC3LimitGuard,
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    guard = module.get<DC3LimitGuard>(DC3LimitGuard);
    billingService = module.get(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should return true when under DC3 limit", async () => {
      billingService.enforceDC3Limit.mockResolvedValue(undefined);
      const context = createMockContext("tenant-1");

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.enforceDC3Limit).toHaveBeenCalledWith("tenant-1");
    });

    it("should throw when DC3 limit exceeded", async () => {
      billingService.enforceDC3Limit.mockRejectedValue(
        new ForbiddenException("DC3 limit reached"),
      );
      const context = createMockContext("tenant-1");

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      const context = createMockContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

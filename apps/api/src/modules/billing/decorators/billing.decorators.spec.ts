import { SetMetadata, UseGuards } from "@nestjs/common";
import {
  RequiresPlan,
  RequiresFeature,
  EnforceLearnerLimit,
  EnforceCourseLimit,
  EnforceDC3Limit,
  ProfessionalFeature,
  EnterpriseFeature,
} from "./billing.decorators";
import {
  REQUIRED_PLAN_KEY,
  REQUIRED_FEATURE_KEY,
  PlanGuard,
  FeatureGuard,
  LearnerLimitGuard,
  CourseLimitGuard,
  DC3LimitGuard,
} from "../guards/plan.guard";

// Mock the @nestjs/common decorators
jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  SetMetadata: jest.fn((key, value) => {
    const decorator = () => {};
    decorator.KEY = key;
    decorator.VALUE = value;
    return decorator;
  }),
  UseGuards: jest.fn((...guards) => {
    const decorator = () => {};
    decorator.GUARDS = guards;
    return decorator;
  }),
  applyDecorators: jest.fn((...decorators) => {
    const combined = () => {};
    combined.DECORATORS = decorators;
    return combined;
  }),
}));

describe("Billing Decorators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("RequiresPlan", () => {
    it("should create decorator with plan metadata and PlanGuard", () => {
      const decorator = RequiresPlan("professional");

      expect(SetMetadata).toHaveBeenCalledWith(
        REQUIRED_PLAN_KEY,
        "professional",
      );
      expect(UseGuards).toHaveBeenCalledWith(PlanGuard);
      expect(decorator).toBeDefined();
    });

    it("should work with basic plan", () => {
      RequiresPlan("basic");

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRED_PLAN_KEY, "basic");
    });

    it("should work with enterprise plan", () => {
      RequiresPlan("enterprise");

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRED_PLAN_KEY, "enterprise");
    });
  });

  describe("RequiresFeature", () => {
    it("should create decorator with feature metadata and FeatureGuard", () => {
      const decorator = RequiresFeature("open_badges");

      expect(SetMetadata).toHaveBeenCalledWith(
        REQUIRED_FEATURE_KEY,
        "open_badges",
      );
      expect(UseGuards).toHaveBeenCalledWith(FeatureGuard);
      expect(decorator).toBeDefined();
    });

    it("should work with different features", () => {
      RequiresFeature("sirce_integration");

      expect(SetMetadata).toHaveBeenCalledWith(
        REQUIRED_FEATURE_KEY,
        "sirce_integration",
      );
    });

    it("should work with custom_branding feature", () => {
      RequiresFeature("custom_branding");

      expect(SetMetadata).toHaveBeenCalledWith(
        REQUIRED_FEATURE_KEY,
        "custom_branding",
      );
    });
  });

  describe("EnforceLearnerLimit", () => {
    it("should create decorator with LearnerLimitGuard", () => {
      const decorator = EnforceLearnerLimit();

      expect(UseGuards).toHaveBeenCalledWith(LearnerLimitGuard);
      expect(decorator).toBeDefined();
    });
  });

  describe("EnforceCourseLimit", () => {
    it("should create decorator with CourseLimitGuard", () => {
      const decorator = EnforceCourseLimit();

      expect(UseGuards).toHaveBeenCalledWith(CourseLimitGuard);
      expect(decorator).toBeDefined();
    });
  });

  describe("EnforceDC3Limit", () => {
    it("should create decorator with DC3LimitGuard", () => {
      const decorator = EnforceDC3Limit();

      expect(UseGuards).toHaveBeenCalledWith(DC3LimitGuard);
      expect(decorator).toBeDefined();
    });
  });

  describe("ProfessionalFeature", () => {
    it("should be equivalent to RequiresPlan professional", () => {
      const decorator = ProfessionalFeature();

      expect(SetMetadata).toHaveBeenCalledWith(
        REQUIRED_PLAN_KEY,
        "professional",
      );
      expect(UseGuards).toHaveBeenCalledWith(PlanGuard);
      expect(decorator).toBeDefined();
    });
  });

  describe("EnterpriseFeature", () => {
    it("should be equivalent to RequiresPlan enterprise", () => {
      const decorator = EnterpriseFeature();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRED_PLAN_KEY, "enterprise");
      expect(UseGuards).toHaveBeenCalledWith(PlanGuard);
      expect(decorator).toBeDefined();
    });
  });

  describe("Decorator integration", () => {
    it("should be callable as decorators", () => {
      // Test that all decorators return callable functions
      expect(typeof RequiresPlan("basic")).toBe("function");
      expect(typeof RequiresFeature("test")).toBe("function");
      expect(typeof EnforceLearnerLimit()).toBe("function");
      expect(typeof EnforceCourseLimit()).toBe("function");
      expect(typeof EnforceDC3Limit()).toBe("function");
      expect(typeof ProfessionalFeature()).toBe("function");
      expect(typeof EnterpriseFeature()).toBe("function");
    });
  });
});

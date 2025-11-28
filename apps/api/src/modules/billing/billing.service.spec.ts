import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { BillingService, AVALA_PLAN_LIMITS } from "./billing.service";
import { PrismaService } from "../../database/prisma.service";
import { ConfigService } from "@nestjs/config";

describe("BillingService", () => {
  let service: BillingService;

  const mockTenantId = "tenant-123";

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    course: {
      count: jest.fn(),
    },
    path: {
      count: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
    },
    artifact: {
      count: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === "JANUA_API_URL") return "http://test-janua:8001";
      if (key === "JANUA_API_KEY") return "test-api-key";
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe("getTenantPlan", () => {
    it("should return tenant plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "PROFESSIONAL" });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("professional");
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        select: { plan: true },
      });
    });

    it("should default to basic if no plan set", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: null });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("basic");
    });

    it("should default to basic for invalid plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "INVALID" });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("basic");
    });

    it("should throw error if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getTenantPlan(mockTenantId)).rejects.toThrow(
        `Tenant not found: ${mockTenantId}`,
      );
    });
  });

  describe("getPlanLimits", () => {
    it("should return basic plan limits", () => {
      const limits = service.getPlanLimits("basic");

      expect(limits).toEqual(AVALA_PLAN_LIMITS.basic);
      expect(limits.learners).toBe(25);
      expect(limits.courses).toBe(10);
    });

    it("should return professional plan limits", () => {
      const limits = service.getPlanLimits("professional");

      expect(limits).toEqual(AVALA_PLAN_LIMITS.professional);
      expect(limits.learners).toBe(100);
      expect(limits.courses).toBe(50);
    });

    it("should return enterprise plan limits with unlimited values", () => {
      const limits = service.getPlanLimits("enterprise");

      expect(limits).toEqual(AVALA_PLAN_LIMITS.enterprise);
      expect(limits.learners).toBe(-1);
      expect(limits.courses).toBe(-1);
    });
  });

  describe("getTenantUsage", () => {
    beforeEach(() => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.course.count.mockResolvedValue(5);
      mockPrisma.path.count.mockResolvedValue(3);
      mockPrisma.certificate.count.mockResolvedValue(15);
      mockPrisma.artifact.count.mockResolvedValue(100);
    });

    it("should return tenant usage stats", async () => {
      const result = await service.getTenantUsage(mockTenantId);

      expect(result).toEqual({
        learners: 10,
        instructors: 10,
        courses: 5,
        paths: 3,
        dc3_this_month: 15,
        storage_used_gb: expect.any(Number),
      });
    });

    it("should count learners with TRAINEE role", async () => {
      await service.getTenantUsage(mockTenantId);

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          role: "TRAINEE",
          status: "ACTIVE",
        },
      });
    });

    it("should count instructors with INSTRUCTOR or ASSESSOR role", async () => {
      await service.getTenantUsage(mockTenantId);

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          role: { in: ["INSTRUCTOR", "ASSESSOR"] },
          status: "ACTIVE",
        },
      });
    });
  });

  describe("checkLearnerLimit", () => {
    it("should return allowed when under limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(10);
      expect(result.limit).toBe(25);
      expect(result.remaining).toBe(15);
    });

    it("should return not allowed when at limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(25);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return unlimited for enterprise plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "ENTERPRISE" });
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.remaining).toBe(-1);
    });
  });

  describe("checkCourseLimit", () => {
    it("should return allowed when under limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.course.count.mockResolvedValue(5);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      const result = await service.checkCourseLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
    });
  });

  describe("checkDC3Limit", () => {
    it("should return allowed when under monthly limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(30);
      mockPrisma.artifact.count.mockResolvedValue(0);

      const result = await service.checkDC3Limit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(30);
      expect(result.limit).toBe(50);
    });
  });

  describe("hasFeature", () => {
    it("should return true if feature is in plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      const result = await service.hasFeature(mockTenantId, "basic_lms");

      expect(result).toBe(true);
    });

    it("should return false if feature is not in plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      const result = await service.hasFeature(mockTenantId, "sso_saml");

      expect(result).toBe(false);
    });

    it("should return true for enterprise features on enterprise plan", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "ENTERPRISE" });

      const result = await service.hasFeature(mockTenantId, "sso_saml");

      expect(result).toBe(true);
    });
  });

  describe("enforceLearnerLimit", () => {
    it("should not throw when under limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      await expect(
        service.enforceLearnerLimit(mockTenantId),
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenException when at limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(25);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      await expect(service.enforceLearnerLimit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceCourseLimit", () => {
    it("should throw ForbiddenException when at limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.course.count.mockResolvedValue(10);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(0);
      mockPrisma.artifact.count.mockResolvedValue(0);

      await expect(service.enforceCourseLimit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceDC3Limit", () => {
    it("should throw ForbiddenException when at limit", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.course.count.mockResolvedValue(0);
      mockPrisma.path.count.mockResolvedValue(0);
      mockPrisma.certificate.count.mockResolvedValue(50);
      mockPrisma.artifact.count.mockResolvedValue(0);

      await expect(service.enforceDC3Limit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceFeature", () => {
    it("should not throw when feature is available", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "PROFESSIONAL" });

      await expect(
        service.enforceFeature(mockTenantId, "advanced_analytics"),
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenException when feature is not available", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      await expect(
        service.enforceFeature(mockTenantId, "sso_saml"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getAvailablePlans", () => {
    it("should return plans with MXN pricing for Mexico", async () => {
      const plans = await service.getAvailablePlans("MX");

      expect(plans).toHaveLength(3);
      expect(plans[0].currency).toBe("MXN");
      expect(plans[0].price).toBe(2499);
      expect(plans[1].popular).toBe(true);
    });

    it("should return plans with USD pricing for international", async () => {
      const plans = await service.getAvailablePlans("US");

      expect(plans).toHaveLength(3);
      expect(plans[0].currency).toBe("USD");
      expect(plans[0].price).toBe(149);
    });

    it("should mark enterprise as contact sales", async () => {
      const plans = await service.getAvailablePlans("MX");

      const enterprise = plans.find((p) => p.id === "enterprise");
      expect(enterprise?.contactSales).toBe(true);
      expect(enterprise?.price).toBeNull();
    });
  });

  describe("createCheckoutSession", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should create checkout session via Janua", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        name: "Test Tenant",
        users: [{ email: "admin@test.com" }],
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ checkout_url: "https://checkout.test" }),
      });

      const result = await service.createCheckoutSession(
        mockTenantId,
        "professional",
        "MX",
        "https://success.test",
        "https://cancel.test",
      );

      expect(result).toEqual({ checkout_url: "https://checkout.test" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-janua:8001/api/billing/checkout",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
          },
        }),
      );
    });

    it("should throw error if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(
          mockTenantId,
          "professional",
          "MX",
          "https://success.test",
          "https://cancel.test",
        ),
      ).rejects.toThrow(`Tenant not found: ${mockTenantId}`);
    });

    it("should throw error if no admin user found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        name: "Test Tenant",
        users: [],
      });

      await expect(
        service.createCheckoutSession(
          mockTenantId,
          "professional",
          "MX",
          "https://success.test",
          "https://cancel.test",
        ),
      ).rejects.toThrow("No admin user found for tenant");
    });

    it("should throw error on Janua API failure", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        name: "Test Tenant",
        users: [{ email: "admin@test.com" }],
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("API Error"),
      });

      await expect(
        service.createCheckoutSession(
          mockTenantId,
          "professional",
          "MX",
          "https://success.test",
          "https://cancel.test",
        ),
      ).rejects.toThrow("Failed to create checkout session");
    });
  });

  describe("getBillingPortalUrl", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return billing portal URL", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: mockTenantId });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: "https://billing.test" }),
      });

      const result = await service.getBillingPortalUrl(
        mockTenantId,
        "https://return.test",
      );

      expect(result).toBe("https://billing.test");
    });

    it("should throw error if tenant not found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.getBillingPortalUrl(mockTenantId, "https://return.test"),
      ).rejects.toThrow(`Tenant not found: ${mockTenantId}`);
    });
  });

  describe("handleSubscriptionUpdate", () => {
    it("should update tenant plan and status", async () => {
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleSubscriptionUpdate(
        mockTenantId,
        "avala_professional",
        "active",
      );

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          plan: "PROFESSIONAL",
          subscriptionStatus: "ACTIVE",
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("handleJanuaSubscriptionCreated", () => {
    it("should update tenant on subscription created", async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ id: mockTenantId });
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleJanuaSubscriptionCreated({
        data: {
          customer_id: "janua-customer-123",
          plan_id: "avala_professional",
          provider: "conekta",
        },
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          plan: "PROFESSIONAL",
          subscriptionStatus: "ACTIVE",
          billingProvider: "conekta",
        },
      });
    });

    it("should do nothing if tenant not found", async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);

      await service.handleJanuaSubscriptionCreated({
        data: { customer_id: "unknown" },
      });

      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });
  });

  describe("handleJanuaSubscriptionCancelled", () => {
    it("should downgrade tenant to basic on cancellation", async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ id: mockTenantId });
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleJanuaSubscriptionCancelled({
        data: { customer_id: "janua-customer-123" },
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          plan: "BASIC",
          subscriptionStatus: "CANCELLED",
        },
      });
    });
  });

  describe("handleJanuaPaymentSucceeded", () => {
    it("should mark subscription as active on payment success", async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ id: mockTenantId });
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleJanuaPaymentSucceeded({
        data: {
          customer_id: "janua-customer-123",
          amount: 7999,
          currency: "MXN",
          provider: "conekta",
        },
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: { subscriptionStatus: "ACTIVE" },
      });
    });
  });

  describe("handleJanuaPaymentFailed", () => {
    it("should mark subscription as past due on payment failure", async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ id: mockTenantId });
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleJanuaPaymentFailed({
        data: {
          customer_id: "janua-customer-123",
          provider: "conekta",
        },
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
    });
  });
});

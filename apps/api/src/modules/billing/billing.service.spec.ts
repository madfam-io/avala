import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { ForbiddenException } from "@nestjs/common";
import { BillingService, AVALA_PLAN_LIMITS } from "./billing.service";
import { PrismaService } from "../../database/prisma.service";

describe("BillingService", () => {
  let service: BillingService;

  const mockTenantId = "tenant-123";
  const mockCustomerId = "cus_123";

  const mockTenant = {
    id: mockTenantId,
    name: "Test Tenant",
    plan: "BASIC",
    subscriptionStatus: "ACTIVE",
    januaCustomerId: mockCustomerId,
    users: [{ email: "admin@test.com" }],
  };

  const mockPrismaService = {
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

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JANUA_API_URL: "http://janua-api:8001",
        JANUA_API_KEY: "test-api-key",
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTenantPlan", () => {
    it("should return tenant plan", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        plan: "PROFESSIONAL",
      });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("professional");
    });

    it("should default to basic if no plan set", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: null });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("basic");
    });

    it("should default to basic for invalid plan", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        plan: "INVALID",
      });

      const result = await service.getTenantPlan(mockTenantId);

      expect(result).toBe("basic");
    });

    it("should throw error if tenant not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

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
    it("should return tenant usage metrics", async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(15) // learners
        .mockResolvedValueOnce(3); // instructors
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(100);

      const usage = await service.getTenantUsage(mockTenantId);

      expect(usage.learners).toBe(15);
      expect(usage.instructors).toBe(3);
      expect(usage.courses).toBe(5);
      expect(usage.paths).toBe(2);
      expect(usage.dc3_this_month).toBe(10);
      expect(usage.storage_used_gb).toBeGreaterThanOrEqual(0);
    });
  });

  describe("checkLearnerLimit", () => {
    beforeEach(() => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(20) // learners
        .mockResolvedValueOnce(2); // instructors
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should allow when under limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(20);
      expect(result.limit).toBe(25);
      expect(result.remaining).toBe(5);
    });

    it("should deny when at limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.user.count.mockReset();
      mockPrismaService.user.count
        .mockResolvedValueOnce(25) // learners at limit
        .mockResolvedValueOnce(2);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return unlimited for enterprise", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        plan: "ENTERPRISE",
      });

      const result = await service.checkLearnerLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.remaining).toBe(-1);
    });
  });

  describe("checkCourseLimit", () => {
    beforeEach(() => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should allow when under limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.course.count.mockResolvedValue(5);

      const result = await service.checkCourseLimit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
    });

    it("should deny when at limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.course.count.mockResolvedValue(10);

      const result = await service.checkCourseLimit(mockTenantId);

      expect(result.allowed).toBe(false);
    });
  });

  describe("checkDC3Limit", () => {
    beforeEach(() => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should allow when under monthly limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.certificate.count.mockResolvedValue(30);

      const result = await service.checkDC3Limit(mockTenantId);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(30);
      expect(result.limit).toBe(50);
    });

    it("should deny when at monthly limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.certificate.count.mockResolvedValue(50);

      const result = await service.checkDC3Limit(mockTenantId);

      expect(result.allowed).toBe(false);
    });
  });

  describe("hasFeature", () => {
    it("should return true for included feature", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      const result = await service.hasFeature(mockTenantId, "basic_lms");

      expect(result).toBe(true);
    });

    it("should return false for excluded feature", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      const result = await service.hasFeature(mockTenantId, "api_access");

      expect(result).toBe(false);
    });

    it("should return true for enterprise features on enterprise plan", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        plan: "ENTERPRISE",
      });

      const result = await service.hasFeature(mockTenantId, "sso_saml");

      expect(result).toBe(true);
    });
  });

  describe("enforceLearnerLimit", () => {
    beforeEach(() => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should not throw when under limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      await expect(
        service.enforceLearnerLimit(mockTenantId),
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenException when at limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.user.count.mockReset();
      mockPrismaService.user.count
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(2);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);

      await expect(service.enforceLearnerLimit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceCourseLimit", () => {
    beforeEach(() => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(10);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should throw ForbiddenException when at limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.course.count.mockResolvedValue(10);

      await expect(service.enforceCourseLimit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceDC3Limit", () => {
    beforeEach(() => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.path.count.mockResolvedValue(2);
      mockPrismaService.artifact.count.mockResolvedValue(50);
    });

    it("should throw ForbiddenException when at monthly limit", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });
      mockPrismaService.certificate.count.mockResolvedValue(50);

      await expect(service.enforceDC3Limit(mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("enforceFeature", () => {
    it("should not throw for allowed feature", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      await expect(
        service.enforceFeature(mockTenantId, "basic_lms"),
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenException for disallowed feature", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ plan: "BASIC" });

      await expect(
        service.enforceFeature(mockTenantId, "api_access"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getAvailablePlans", () => {
    it("should return MXN pricing for Mexico", async () => {
      const plans = await service.getAvailablePlans("MX");

      expect(plans[0].currency).toBe("MXN");
      expect(plans[0].price).toBe(2499);
      expect(plans[1].price).toBe(7999);
    });

    it("should return USD pricing for other countries", async () => {
      const plans = await service.getAvailablePlans("US");

      expect(plans[0].currency).toBe("USD");
      expect(plans[0].price).toBe(149);
      expect(plans[1].price).toBe(449);
    });

    it("should mark professional plan as popular", async () => {
      const plans = await service.getAvailablePlans("MX");

      const professional = plans.find((p) => p.id === "professional");
      expect(professional?.popular).toBe(true);
    });

    it("should mark enterprise as contact sales", async () => {
      const plans = await service.getAvailablePlans("MX");

      const enterprise = plans.find((p) => p.id === "enterprise");
      expect(enterprise?.contactSales).toBe(true);
      expect(enterprise?.price).toBeNull();
    });
  });

  describe("handleSubscriptionUpdate", () => {
    it("should update tenant plan and status", async () => {
      mockPrismaService.tenant.update.mockResolvedValue({});

      await service.handleSubscriptionUpdate(
        mockTenantId,
        "avala_professional",
        "active",
      );

      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: mockTenantId },
        data: {
          plan: "PROFESSIONAL",
          subscriptionStatus: "ACTIVE",
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("Janua Webhook Handlers", () => {
    describe("handleJanuaSubscriptionCreated", () => {
      it("should create subscription for tenant", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
        mockPrismaService.tenant.update.mockResolvedValue({});

        await service.handleJanuaSubscriptionCreated({
          data: {
            customer_id: mockCustomerId,
            plan_id: "avala_professional",
            provider: "conekta",
          },
        });

        expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: mockTenantId },
          data: {
            plan: "PROFESSIONAL",
            subscriptionStatus: "ACTIVE",
            billingProvider: "conekta",
          },
        });
      });

      it("should handle missing tenant gracefully", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(null);

        await expect(
          service.handleJanuaSubscriptionCreated({
            data: {
              customer_id: "unknown",
              plan_id: "basic",
              provider: "polar",
            },
          }),
        ).resolves.not.toThrow();
      });
    });

    describe("handleJanuaSubscriptionUpdated", () => {
      it("should update subscription status", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
        mockPrismaService.tenant.update.mockResolvedValue({});

        await service.handleJanuaSubscriptionUpdated({
          data: {
            customer_id: mockCustomerId,
            plan_id: "avala_enterprise",
            status: "active",
          },
        });

        expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: mockTenantId },
          data: {
            plan: "ENTERPRISE",
            subscriptionStatus: "ACTIVE",
          },
        });
      });
    });

    describe("handleJanuaSubscriptionCancelled", () => {
      it("should downgrade to basic and mark cancelled", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
        mockPrismaService.tenant.update.mockResolvedValue({});

        await service.handleJanuaSubscriptionCancelled({
          data: { customer_id: mockCustomerId },
        });

        expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: mockTenantId },
          data: {
            plan: "BASIC",
            subscriptionStatus: "CANCELLED",
          },
        });
      });
    });

    describe("handleJanuaPaymentSucceeded", () => {
      it("should ensure subscription is active", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
        mockPrismaService.tenant.update.mockResolvedValue({});

        await service.handleJanuaPaymentSucceeded({
          data: {
            customer_id: mockCustomerId,
            amount: 7999,
            currency: "MXN",
            provider: "conekta",
          },
        });

        expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: mockTenantId },
          data: { subscriptionStatus: "ACTIVE" },
        });
      });
    });

    describe("handleJanuaPaymentFailed", () => {
      it("should mark subscription as past due", async () => {
        mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
        mockPrismaService.tenant.update.mockResolvedValue({});

        await service.handleJanuaPaymentFailed({
          data: {
            customer_id: mockCustomerId,
            provider: "conekta",
          },
        });

        expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: mockTenantId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
      });
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
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
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
        "http://janua-api:8001/api/billing/checkout",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        }),
      );
    });

    it("should throw error if tenant not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

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
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
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
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
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
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: "https://portal.test" }),
      });

      const result = await service.getBillingPortalUrl(
        mockTenantId,
        "https://return.test",
      );

      expect(result).toBe("https://portal.test");
    });

    it("should throw error if tenant not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.getBillingPortalUrl(mockTenantId, "https://return.test"),
      ).rejects.toThrow(`Tenant not found: ${mockTenantId}`);
    });

    it("should throw error on API failure", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(
        service.getBillingPortalUrl(mockTenantId, "https://return.test"),
      ).rejects.toThrow("Failed to create billing portal session");
    });
  });
});

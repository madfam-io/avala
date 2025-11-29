import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BillingController } from "./billing.controller";
import { BillingService, AVALA_PLAN_LIMITS } from "./billing.service";
import { JanuaWebhookEventType } from "./dto/janua-webhook.dto";

describe("BillingController", () => {
  let controller: BillingController;

  const mockTenantId = "tenant-123";

  const mockBillingService = {
    getAvailablePlans: jest.fn(),
    getTenantPlan: jest.fn(),
    getTenantUsage: jest.fn(),
    getPlanLimits: jest.fn(),
    checkLearnerLimit: jest.fn(),
    checkCourseLimit: jest.fn(),
    checkDC3Limit: jest.fn(),
    createCheckoutSession: jest.fn(),
    getBillingPortalUrl: jest.fn(),
    handleJanuaSubscriptionCreated: jest.fn(),
    handleJanuaSubscriptionUpdated: jest.fn(),
    handleJanuaSubscriptionCancelled: jest.fn(),
    handleJanuaPaymentSucceeded: jest.fn(),
    handleJanuaPaymentFailed: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(""),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPlans", () => {
    it("should return available plans for MX", async () => {
      const mockPlans = [
        { id: "basic", price: 2499, currency: "MXN" },
        { id: "professional", price: 7999, currency: "MXN" },
      ];
      mockBillingService.getAvailablePlans.mockResolvedValue(mockPlans);

      const result = await controller.getPlans("MX");

      expect(result).toEqual(mockPlans);
      expect(mockBillingService.getAvailablePlans).toHaveBeenCalledWith("MX");
    });

    it("should default to MX country", async () => {
      mockBillingService.getAvailablePlans.mockResolvedValue([]);

      await controller.getPlans();

      expect(mockBillingService.getAvailablePlans).toHaveBeenCalledWith("MX");
    });
  });

  describe("getSubscription", () => {
    it("should return subscription status with usage", async () => {
      mockBillingService.getTenantPlan.mockResolvedValue("professional");
      mockBillingService.getTenantUsage.mockResolvedValue({
        learners: 50,
        instructors: 5,
        courses: 20,
        paths: 10,
        dc3_this_month: 100,
        storage_used_gb: 10,
      });
      mockBillingService.getPlanLimits.mockReturnValue(
        AVALA_PLAN_LIMITS.professional,
      );

      const result = await controller.getSubscription(mockTenantId);

      expect(result.plan).toBe("professional");
      expect(result.usage.learners).toBe(50);
      expect(result.limits).toEqual(AVALA_PLAN_LIMITS.professional);
      expect(result.utilization.learners).toBe(50); // 50/100 * 100
    });

    it("should handle unlimited limits", async () => {
      mockBillingService.getTenantPlan.mockResolvedValue("enterprise");
      mockBillingService.getTenantUsage.mockResolvedValue({
        learners: 500,
        instructors: 50,
        courses: 100,
        paths: 50,
        dc3_this_month: 1000,
        storage_used_gb: 100,
      });
      mockBillingService.getPlanLimits.mockReturnValue(
        AVALA_PLAN_LIMITS.enterprise,
      );

      const result = await controller.getSubscription(mockTenantId);

      expect(result.utilization.learners).toBe(0); // -1 limit = 0 utilization
      expect(result.utilization.courses).toBe(0);
    });
  });

  describe("getUsage", () => {
    it("should return detailed usage with limit checks", async () => {
      mockBillingService.getTenantUsage.mockResolvedValue({
        learners: 20,
        instructors: 2,
        courses: 5,
        paths: 3,
        dc3_this_month: 30,
        storage_used_gb: 2,
      });
      mockBillingService.getTenantPlan.mockResolvedValue("basic");
      mockBillingService.getPlanLimits.mockReturnValue(AVALA_PLAN_LIMITS.basic);
      mockBillingService.checkLearnerLimit.mockResolvedValue({
        allowed: true,
        current: 20,
        limit: 25,
        remaining: 5,
      });
      mockBillingService.checkCourseLimit.mockResolvedValue({
        allowed: true,
        current: 5,
        limit: 10,
        remaining: 5,
      });
      mockBillingService.checkDC3Limit.mockResolvedValue({
        allowed: true,
        current: 30,
        limit: 50,
        remaining: 20,
      });

      const result = await controller.getUsage(mockTenantId);

      expect(result.usage.learners).toBe(20);
      expect(result.limits).toEqual(AVALA_PLAN_LIMITS.basic);
      expect(result.checks.learners.allowed).toBe(true);
      expect(result.checks.courses.allowed).toBe(true);
      expect(result.checks.dc3.allowed).toBe(true);
    });
  });

  describe("getFeatures", () => {
    it("should return all features with availability", async () => {
      mockBillingService.getTenantPlan.mockResolvedValue("basic");
      mockBillingService.getPlanLimits.mockReturnValue(AVALA_PLAN_LIMITS.basic);

      const result = await controller.getFeatures(mockTenantId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      const basicLms = result.find((f) => f.id === "basic_lms");
      expect(basicLms?.available).toBe(true);

      const apiAccess = result.find((f) => f.id === "api_access");
      expect(apiAccess?.available).toBe(false);
    });

    it("should show all features available for enterprise", async () => {
      mockBillingService.getTenantPlan.mockResolvedValue("enterprise");
      mockBillingService.getPlanLimits.mockReturnValue(
        AVALA_PLAN_LIMITS.enterprise,
      );

      const result = await controller.getFeatures(mockTenantId);

      const ssoSaml = result.find((f) => f.id === "sso_saml");
      expect(ssoSaml?.available).toBe(true);

      const dedicatedSupport = result.find((f) => f.id === "dedicated_support");
      expect(dedicatedSupport?.available).toBe(true);
    });
  });

  describe("createCheckout", () => {
    it("should create checkout session", async () => {
      const checkoutUrl = "https://checkout.test/session123";
      mockBillingService.createCheckoutSession.mockResolvedValue({
        url: checkoutUrl,
      });

      const result = await controller.createCheckout(mockTenantId, {
        planId: "professional",
        successUrl: "https://app.test/success",
        cancelUrl: "https://app.test/cancel",
      });

      expect(result).toEqual({ url: checkoutUrl });
      expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
        mockTenantId,
        "professional",
        "MX",
        "https://app.test/success",
        "https://app.test/cancel",
      );
    });

    it("should use provided country code", async () => {
      mockBillingService.createCheckoutSession.mockResolvedValue({
        url: "https://checkout.test",
      });

      await controller.createCheckout(mockTenantId, {
        planId: "professional",
        countryCode: "US",
        successUrl: "https://app.test/success",
        cancelUrl: "https://app.test/cancel",
      });

      expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
        mockTenantId,
        "professional",
        "US",
        "https://app.test/success",
        "https://app.test/cancel",
      );
    });
  });

  describe("getBillingPortal", () => {
    it("should return billing portal URL", async () => {
      const portalUrl = "https://portal.test/session123";
      mockBillingService.getBillingPortalUrl.mockResolvedValue(portalUrl);

      const result = await controller.getBillingPortal(mockTenantId, {
        returnUrl: "https://app.test/settings",
      });

      expect(result).toEqual({ url: portalUrl });
      expect(mockBillingService.getBillingPortalUrl).toHaveBeenCalledWith(
        mockTenantId,
        "https://app.test/settings",
      );
    });
  });

  describe("checkLimit", () => {
    it("should check learner limit", async () => {
      const checkResult = {
        allowed: true,
        current: 20,
        limit: 25,
        remaining: 5,
      };
      mockBillingService.checkLearnerLimit.mockResolvedValue(checkResult);

      const result = await controller.checkLimit(mockTenantId, "learners");

      expect(result).toEqual(checkResult);
      expect(mockBillingService.checkLearnerLimit).toHaveBeenCalledWith(
        mockTenantId,
      );
    });

    it("should check course limit", async () => {
      const checkResult = {
        allowed: true,
        current: 5,
        limit: 10,
        remaining: 5,
      };
      mockBillingService.checkCourseLimit.mockResolvedValue(checkResult);

      const result = await controller.checkLimit(mockTenantId, "courses");

      expect(result).toEqual(checkResult);
      expect(mockBillingService.checkCourseLimit).toHaveBeenCalledWith(
        mockTenantId,
      );
    });

    it("should check DC3 limit", async () => {
      const checkResult = {
        allowed: false,
        current: 50,
        limit: 50,
        remaining: 0,
      };
      mockBillingService.checkDC3Limit.mockResolvedValue(checkResult);

      const result = await controller.checkLimit(mockTenantId, "dc3");

      expect(result).toEqual(checkResult);
      expect(mockBillingService.checkDC3Limit).toHaveBeenCalledWith(
        mockTenantId,
      );
    });

    it("should throw error for unknown limit type", async () => {
      await expect(
        controller.checkLimit(mockTenantId, "unknown" as any),
      ).rejects.toThrow("Unknown limit type: unknown");
    });
  });

  describe("handleJanuaWebhook", () => {
    const createMockRequest = (rawBody: string) =>
      ({
        rawBody: Buffer.from(rawBody),
      }) as any;

    it("should handle subscription created event", async () => {
      const payload = {
        id: "evt_123",
        type: JanuaWebhookEventType.SUBSCRIPTION_CREATED,
        timestamp: new Date().toISOString(),
        data: {
          customer_id: "cus_123",
          plan_id: "avala_professional",
          provider: "conekta" as const,
        },
      };
      mockBillingService.handleJanuaSubscriptionCreated.mockResolvedValue(
        undefined,
      );

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result).toEqual({
        received: true,
        event: JanuaWebhookEventType.SUBSCRIPTION_CREATED,
      });
      expect(
        mockBillingService.handleJanuaSubscriptionCreated,
      ).toHaveBeenCalledWith(payload);
    });

    it("should handle subscription updated event", async () => {
      const payload = {
        id: "evt_124",
        type: JanuaWebhookEventType.SUBSCRIPTION_UPDATED,
        timestamp: new Date().toISOString(),
        data: {
          customer_id: "cus_123",
          plan_id: "avala_enterprise",
          status: "active",
          provider: "polar" as const,
        },
      };
      mockBillingService.handleJanuaSubscriptionUpdated.mockResolvedValue(
        undefined,
      );

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(true);
      expect(
        mockBillingService.handleJanuaSubscriptionUpdated,
      ).toHaveBeenCalledWith(payload);
    });

    it("should handle subscription cancelled event", async () => {
      const payload = {
        id: "evt_125",
        type: JanuaWebhookEventType.SUBSCRIPTION_CANCELLED,
        timestamp: new Date().toISOString(),
        data: {
          customer_id: "cus_123",
          provider: "conekta" as const,
        },
      };
      mockBillingService.handleJanuaSubscriptionCancelled.mockResolvedValue(
        undefined,
      );

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(true);
      expect(
        mockBillingService.handleJanuaSubscriptionCancelled,
      ).toHaveBeenCalledWith(payload);
    });

    it("should handle payment succeeded event", async () => {
      const payload = {
        id: "evt_126",
        type: JanuaWebhookEventType.PAYMENT_SUCCEEDED,
        timestamp: new Date().toISOString(),
        data: {
          customer_id: "cus_123",
          amount: 7999,
          currency: "MXN",
          provider: "conekta" as const,
        },
      };
      mockBillingService.handleJanuaPaymentSucceeded.mockResolvedValue(
        undefined,
      );

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(true);
      expect(
        mockBillingService.handleJanuaPaymentSucceeded,
      ).toHaveBeenCalledWith(payload);
    });

    it("should handle payment failed event", async () => {
      const payload = {
        id: "evt_127",
        type: JanuaWebhookEventType.PAYMENT_FAILED,
        timestamp: new Date().toISOString(),
        data: {
          customer_id: "cus_123",
          provider: "conekta" as const,
        },
      };
      mockBillingService.handleJanuaPaymentFailed.mockResolvedValue(undefined);

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(true);
      expect(mockBillingService.handleJanuaPaymentFailed).toHaveBeenCalledWith(
        payload,
      );
    });

    it("should handle unrecognized event type", async () => {
      const payload = {
        id: "evt_128",
        type: "unknown.event" as JanuaWebhookEventType,
        timestamp: new Date().toISOString(),
        data: { provider: "conekta" as const },
      };

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(true);
    });

    it("should return error on handler exception", async () => {
      const payload = {
        id: "evt_129",
        type: JanuaWebhookEventType.SUBSCRIPTION_CREATED,
        timestamp: new Date().toISOString(),
        data: { customer_id: "cus_123", provider: "conekta" as const },
      };
      mockBillingService.handleJanuaSubscriptionCreated.mockRejectedValue(
        new Error("Handler error"),
      );

      const result = await controller.handleJanuaWebhook(
        createMockRequest(JSON.stringify(payload)),
        "",
        payload,
      );

      expect(result.received).toBe(false);
      expect(result.error).toBe("Handler error");
    });
  });
});

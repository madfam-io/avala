import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { Plan, SubscriptionStatus } from "@avala/db";

/**
 * Avala Plan Limits
 *
 * Tiers designed for workforce training/compliance:
 * - Starter: Small teams, basic compliance
 * - Professional: Growing orgs, full DC-3/SIRCE
 * - Enterprise: Large orgs, unlimited + dedicated support
 */
export const AVALA_PLAN_LIMITS = {
  basic: {
    learners: 25,
    instructors: 3,
    courses: 10,
    paths: 5,
    dc3_per_month: 50,
    storage_gb: 5,
    features: ["basic_lms", "dc3_generation", "basic_analytics"],
  },
  professional: {
    learners: 100,
    instructors: 10,
    courses: 50,
    paths: 25,
    dc3_per_month: 500,
    storage_gb: 50,
    features: [
      "basic_lms",
      "dc3_generation",
      "sirce_export",
      "lft_plans",
      "open_badges",
      "advanced_analytics",
      "custom_branding",
      "api_access",
    ],
  },
  enterprise: {
    learners: -1, // unlimited
    instructors: -1,
    courses: -1,
    paths: -1,
    dc3_per_month: -1,
    storage_gb: 500,
    features: [
      "basic_lms",
      "dc3_generation",
      "sirce_export",
      "lft_plans",
      "open_badges",
      "advanced_analytics",
      "custom_branding",
      "api_access",
      "ece_oc_toolkit",
      "sso_saml",
      "scim_provisioning",
      "dedicated_support",
      "sla_guarantee",
    ],
  },
} as const;

export type AvalaPlanTier = keyof typeof AVALA_PLAN_LIMITS;

export interface TenantUsage {
  learners: number;
  instructors: number;
  courses: number;
  paths: number;
  dc3_this_month: number;
  storage_used_gb: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly januaApiUrl: string;
  private readonly januaApiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.januaApiUrl = this.config.get(
      "JANUA_API_URL",
      "http://janua-api:8001",
    );
    this.januaApiKey = this.config.get("JANUA_API_KEY", "");
  }

  /**
   * Get tenant's current plan tier
   */
  async getTenantPlan(tenantId: string): Promise<AvalaPlanTier> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Default to basic if no plan set
    const plan = (tenant.plan || "basic").toLowerCase() as AvalaPlanTier;
    return plan in AVALA_PLAN_LIMITS ? plan : "basic";
  }

  /**
   * Get plan limits for a tier
   */
  getPlanLimits(tier: AvalaPlanTier) {
    return AVALA_PLAN_LIMITS[tier];
  }

  /**
   * Get current usage for a tenant
   */
  async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [learnerCount, instructorCount, courseCount, pathCount, dc3Count] =
      await Promise.all([
        // Count learners (users with trainee role)
        this.prisma.user.count({
          where: {
            tenantId,
            role: "TRAINEE",
            status: "ACTIVE",
          },
        }),
        // Count instructors
        this.prisma.user.count({
          where: {
            tenantId,
            role: { in: ["INSTRUCTOR", "ASSESSOR"] },
            status: "ACTIVE",
          },
        }),
        // Count courses
        this.prisma.course.count({
          where: { tenantId },
        }),
        // Count learning paths
        this.prisma.path.count({
          where: { tenantId },
        }),
        // Count DC-3s generated this month (through enrollment relation)
        this.prisma.certificate.count({
          where: {
            enrollment: {
              course: { tenantId },
            },
            createdAt: { gte: startOfMonth },
          },
        }),
      ]);

    // Storage calculation would come from file storage service
    // For now, estimate based on artifact count (through trainee relation)
    const artifactCount = await this.prisma.artifact.count({
      where: {
        trainee: { tenantId },
      },
    });
    const estimatedStorageGb = (artifactCount * 5) / 1024; // ~5MB per artifact avg

    return {
      learners: learnerCount,
      instructors: instructorCount,
      courses: courseCount,
      paths: pathCount,
      dc3_this_month: dc3Count,
      storage_used_gb: Math.round(estimatedStorageGb * 100) / 100,
    };
  }

  /**
   * Check if tenant can add more learners
   */
  async checkLearnerLimit(tenantId: string): Promise<UsageCheckResult> {
    const [plan, usage] = await Promise.all([
      this.getTenantPlan(tenantId),
      this.getTenantUsage(tenantId),
    ]);

    const limits = this.getPlanLimits(plan);
    const limit = limits.learners;

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        current: usage.learners,
        limit: -1,
        remaining: -1,
      };
    }

    return {
      allowed: usage.learners < limit,
      current: usage.learners,
      limit,
      remaining: Math.max(0, limit - usage.learners),
    };
  }

  /**
   * Check if tenant can create more courses
   */
  async checkCourseLimit(tenantId: string): Promise<UsageCheckResult> {
    const [plan, usage] = await Promise.all([
      this.getTenantPlan(tenantId),
      this.getTenantUsage(tenantId),
    ]);

    const limits = this.getPlanLimits(plan);
    const limit = limits.courses;

    if (limit === -1) {
      return {
        allowed: true,
        current: usage.courses,
        limit: -1,
        remaining: -1,
      };
    }

    return {
      allowed: usage.courses < limit,
      current: usage.courses,
      limit,
      remaining: Math.max(0, limit - usage.courses),
    };
  }

  /**
   * Check if tenant can generate more DC-3s this month
   */
  async checkDC3Limit(tenantId: string): Promise<UsageCheckResult> {
    const [plan, usage] = await Promise.all([
      this.getTenantPlan(tenantId),
      this.getTenantUsage(tenantId),
    ]);

    const limits = this.getPlanLimits(plan);
    const limit = limits.dc3_per_month;

    if (limit === -1) {
      return {
        allowed: true,
        current: usage.dc3_this_month,
        limit: -1,
        remaining: -1,
      };
    }

    return {
      allowed: usage.dc3_this_month < limit,
      current: usage.dc3_this_month,
      limit,
      remaining: Math.max(0, limit - usage.dc3_this_month),
    };
  }

  /**
   * Check if tenant has access to a feature
   */
  async hasFeature(tenantId: string, feature: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = this.getPlanLimits(plan);
    return (limits.features as readonly string[]).includes(feature);
  }

  /**
   * Enforce learner limit - throws if exceeded
   */
  async enforceLearnerLimit(tenantId: string): Promise<void> {
    const check = await this.checkLearnerLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(
        `Learner limit reached (${check.current}/${check.limit}). Upgrade your plan to add more learners.`,
      );
    }
  }

  /**
   * Enforce course limit - throws if exceeded
   */
  async enforceCourseLimit(tenantId: string): Promise<void> {
    const check = await this.checkCourseLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(
        `Course limit reached (${check.current}/${check.limit}). Upgrade your plan to create more courses.`,
      );
    }
  }

  /**
   * Enforce DC-3 monthly limit - throws if exceeded
   */
  async enforceDC3Limit(tenantId: string): Promise<void> {
    const check = await this.checkDC3Limit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(
        `DC-3 monthly limit reached (${check.current}/${check.limit}). Upgrade your plan or wait until next month.`,
      );
    }
  }

  /**
   * Enforce feature access - throws if not available
   */
  async enforceFeature(tenantId: string, feature: string): Promise<void> {
    const hasAccess = await this.hasFeature(tenantId, feature);
    if (!hasAccess) {
      throw new ForbiddenException(
        `Feature '${feature}' is not available on your current plan. Please upgrade to access this feature.`,
      );
    }
  }

  /**
   * Get available plans with pricing (from Janua)
   */
  async getAvailablePlans(countryCode: string = "MX") {
    // For Mexico, use Conekta pricing in MXN
    // For international, use Polar.sh/Stripe in USD
    const isMexico = countryCode === "MX";

    return [
      {
        id: "basic",
        name: "Basic",
        description: "Para equipos pequeños comenzando con capacitación formal",
        price: isMexico ? 2499 : 149,
        currency: isMexico ? "MXN" : "USD",
        interval: "month",
        limits: AVALA_PLAN_LIMITS.basic,
        popular: false,
      },
      {
        id: "professional",
        name: "Professional",
        description:
          "Para organizaciones con necesidades de cumplimiento DC-3/SIRCE",
        price: isMexico ? 7999 : 449,
        currency: isMexico ? "MXN" : "USD",
        interval: "month",
        limits: AVALA_PLAN_LIMITS.professional,
        popular: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "Para grandes organizaciones con necesidades avanzadas",
        price: null, // Contact sales
        currency: isMexico ? "MXN" : "USD",
        interval: "month",
        limits: AVALA_PLAN_LIMITS.enterprise,
        popular: false,
        contactSales: true,
      },
    ];
  }

  /**
   * Create checkout session via Janua
   */
  async createCheckoutSession(
    tenantId: string,
    planId: string,
    countryCode: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const adminUser = tenant.users[0];
    if (!adminUser) {
      throw new Error("No admin user found for tenant");
    }

    // Call Janua billing API
    const response = await fetch(`${this.januaApiUrl}/api/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        customer_email: adminUser.email,
        customer_name: tenant.name,
        plan_id: `avala_${planId}`,
        country_code: countryCode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenant_id: tenantId,
          product: "avala",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua checkout error: ${error}`);
      throw new Error("Failed to create checkout session");
    }

    return response.json();
  }

  /**
   * Get billing portal URL via Janua
   */
  async getBillingPortalUrl(
    tenantId: string,
    returnUrl: string,
  ): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const response = await fetch(`${this.januaApiUrl}/api/billing/portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create billing portal session");
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  /**
   * Handle subscription webhook from Janua
   */
  async handleSubscriptionUpdate(
    tenantId: string,
    planId: string,
    status: string,
  ): Promise<void> {
    const plan = planId.replace("avala_", "").toUpperCase() as Plan;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Updated tenant ${tenantId} to plan ${plan} (${status})`);
  }

  // ==========================================
  // Janua Webhook Handlers
  // ==========================================

  /**
   * Handle Janua subscription created event
   */
  async handleJanuaSubscriptionCreated(payload: any): Promise<void> {
    const { customer_id, plan_id, provider } = payload.data;

    const tenant = await this.prisma.tenant.findFirst({
      where: { januaCustomerId: customer_id },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for Janua customer: ${customer_id}`);
      return;
    }

    // Extract plan tier from Janua plan_id (e.g., "avala_professional" -> "PROFESSIONAL")
    const planTier = (plan_id || "basic").replace("avala_", "").toUpperCase();

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: planTier,
        subscriptionStatus: "ACTIVE",
        billingProvider: provider,
      },
    });

    this.logger.log(
      `Janua subscription created for tenant ${tenant.id} via ${provider}: ${planTier}`,
    );
  }

  /**
   * Handle Janua subscription updated event
   */
  async handleJanuaSubscriptionUpdated(payload: any): Promise<void> {
    const { customer_id, plan_id, status } = payload.data;

    const tenant = await this.prisma.tenant.findFirst({
      where: { januaCustomerId: customer_id },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for Janua customer: ${customer_id}`);
      return;
    }

    const updateData: any = {};

    if (plan_id) {
      updateData.plan = plan_id.replace("avala_", "").toUpperCase();
    }

    if (status) {
      updateData.subscriptionStatus = status.toUpperCase();
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
    });

    this.logger.log(
      `Janua subscription updated for tenant ${tenant.id}: ${status}`,
    );
  }

  /**
   * Handle Janua subscription cancelled event
   */
  async handleJanuaSubscriptionCancelled(payload: any): Promise<void> {
    const { customer_id } = payload.data;

    const tenant = await this.prisma.tenant.findFirst({
      where: { januaCustomerId: customer_id },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for Janua customer: ${customer_id}`);
      return;
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: "BASIC",
        subscriptionStatus: "CANCELLED",
      },
    });

    this.logger.log(`Janua subscription cancelled for tenant ${tenant.id}`);
  }

  /**
   * Handle Janua payment succeeded event
   */
  async handleJanuaPaymentSucceeded(payload: any): Promise<void> {
    const { customer_id, amount, currency, provider } = payload.data;

    const tenant = await this.prisma.tenant.findFirst({
      where: { januaCustomerId: customer_id },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for Janua customer: ${customer_id}`);
      return;
    }

    // Ensure subscription is active
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: "ACTIVE" },
    });

    this.logger.log(
      `Janua payment succeeded for tenant ${tenant.id}: ${currency} ${amount} via ${provider}`,
    );
  }

  /**
   * Handle Janua payment failed event
   */
  async handleJanuaPaymentFailed(payload: any): Promise<void> {
    const { customer_id, provider } = payload.data;

    const tenant = await this.prisma.tenant.findFirst({
      where: { januaCustomerId: customer_id },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for Janua customer: ${customer_id}`);
      return;
    }

    // Mark as past due but don't immediately downgrade
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: "PAST_DUE" },
    });

    this.logger.warn(
      `Janua payment failed for tenant ${tenant.id} via ${provider}`,
    );
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService, AvalaPlanTier } from '../billing.service';

export const REQUIRED_PLAN_KEY = 'required_plan';
export const REQUIRED_FEATURE_KEY = 'required_feature';

/**
 * Guard that checks if tenant has required plan tier
 */
@Injectable()
export class PlanGuard implements CanActivate {
  private readonly planHierarchy: AvalaPlanTier[] = ['basic', 'professional', 'enterprise'];

  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<AvalaPlanTier>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const currentPlan = await this.billingService.getTenantPlan(tenantId);
    const currentIndex = this.planHierarchy.indexOf(currentPlan);
    const requiredIndex = this.planHierarchy.indexOf(requiredPlan);

    if (currentIndex < requiredIndex) {
      throw new ForbiddenException(
        `This feature requires ${requiredPlan} plan or higher. Current plan: ${currentPlan}`,
      );
    }

    return true;
  }
}

/**
 * Guard that checks if tenant has required feature
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const hasFeature = await this.billingService.hasFeature(tenantId, requiredFeature);

    if (!hasFeature) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' is not available on your current plan. Please upgrade to access this feature.`,
      );
    }

    return true;
  }
}

/**
 * Guard that checks learner limit before adding new learners
 */
@Injectable()
export class LearnerLimitGuard implements CanActivate {
  constructor(private readonly billingService: BillingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    await this.billingService.enforceLearnerLimit(tenantId);
    return true;
  }
}

/**
 * Guard that checks course limit before creating new courses
 */
@Injectable()
export class CourseLimitGuard implements CanActivate {
  constructor(private readonly billingService: BillingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    await this.billingService.enforceCourseLimit(tenantId);
    return true;
  }
}

/**
 * Guard that checks DC-3 monthly limit before generation
 */
@Injectable()
export class DC3LimitGuard implements CanActivate {
  constructor(private readonly billingService: BillingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    await this.billingService.enforceDC3Limit(tenantId);
    return true;
  }
}

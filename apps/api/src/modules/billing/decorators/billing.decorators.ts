import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { AvalaPlanTier } from '../billing.service';
import {
  REQUIRED_PLAN_KEY,
  REQUIRED_FEATURE_KEY,
  PlanGuard,
  FeatureGuard,
  LearnerLimitGuard,
  CourseLimitGuard,
  DC3LimitGuard,
} from '../guards/plan.guard';

/**
 * Decorator to require a minimum plan tier for an endpoint
 *
 * @example
 * @RequiresPlan('professional')
 * @Get('sirce-export')
 * exportSirce() { ... }
 */
export const RequiresPlan = (plan: AvalaPlanTier) =>
  applyDecorators(SetMetadata(REQUIRED_PLAN_KEY, plan), UseGuards(PlanGuard));

/**
 * Decorator to require a specific feature for an endpoint
 *
 * @example
 * @RequiresFeature('open_badges')
 * @Post('badges')
 * createBadge() { ... }
 */
export const RequiresFeature = (feature: string) =>
  applyDecorators(SetMetadata(REQUIRED_FEATURE_KEY, feature), UseGuards(FeatureGuard));

/**
 * Decorator to enforce learner limit before creating new learners
 *
 * @example
 * @EnforceLearnerLimit()
 * @Post('learners')
 * createLearner() { ... }
 */
export const EnforceLearnerLimit = () => UseGuards(LearnerLimitGuard);

/**
 * Decorator to enforce course limit before creating new courses
 *
 * @example
 * @EnforceCourseLimit()
 * @Post('courses')
 * createCourse() { ... }
 */
export const EnforceCourseLimit = () => UseGuards(CourseLimitGuard);

/**
 * Decorator to enforce DC-3 monthly limit before generation
 *
 * @example
 * @EnforceDC3Limit()
 * @Post('certificates/dc3')
 * generateDC3() { ... }
 */
export const EnforceDC3Limit = () => UseGuards(DC3LimitGuard);

/**
 * Combined decorator for professional tier features
 */
export const ProfessionalFeature = () => RequiresPlan('professional');

/**
 * Combined decorator for enterprise tier features
 */
export const EnterpriseFeature = () => RequiresPlan('enterprise');

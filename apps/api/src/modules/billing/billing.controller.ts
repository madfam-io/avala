import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JanuaWebhookPayloadDto, JanuaWebhookEventType } from './dto/janua-webhook.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  // ==========================================
  // Janua Webhook Endpoint (Public - no auth)
  // ==========================================

  @Post('webhook/janua')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive billing webhooks from Janua' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed' })
  async handleJanuaWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-janua-signature') signature: string,
    @Body() payload: JanuaWebhookPayloadDto,
  ) {
    // Verify webhook signature
    const webhookSecret = this.configService.get<string>('JANUA_WEBHOOK_SECRET', '');
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);

    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature))) {
        this.logger.error('Janua webhook signature verification failed');
        return { received: false, error: 'Invalid signature' };
      }
    }

    this.logger.log(`Received Janua webhook: ${payload.type} from provider ${payload.data.provider}`);

    try {
      switch (payload.type) {
        case JanuaWebhookEventType.SUBSCRIPTION_CREATED:
          await this.billingService.handleJanuaSubscriptionCreated(payload);
          break;

        case JanuaWebhookEventType.SUBSCRIPTION_UPDATED:
          await this.billingService.handleJanuaSubscriptionUpdated(payload);
          break;

        case JanuaWebhookEventType.SUBSCRIPTION_CANCELLED:
          await this.billingService.handleJanuaSubscriptionCancelled(payload);
          break;

        case JanuaWebhookEventType.PAYMENT_SUCCEEDED:
          await this.billingService.handleJanuaPaymentSucceeded(payload);
          break;

        case JanuaWebhookEventType.PAYMENT_FAILED:
          await this.billingService.handleJanuaPaymentFailed(payload);
          break;

        default:
          this.logger.log(`Unhandled Janua event type: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Janua webhook: ${error.message}`, error.stack);
      return { received: false, error: error.message };
    }

    return { received: true, event: payload.type };
  }

  // ==========================================
  // Public Endpoints
  // ==========================================

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiQuery({ name: 'country', required: false, description: 'Country code for pricing (default: MX)' })
  async getPlans(@Query('country') country: string = 'MX') {
    return this.billingService.getAvailablePlans(country);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant subscription status' })
  async getSubscription(@CurrentTenant() tenantId: string) {
    const [plan, usage] = await Promise.all([
      this.billingService.getTenantPlan(tenantId),
      this.billingService.getTenantUsage(tenantId),
    ]);

    const limits = this.billingService.getPlanLimits(plan);

    return {
      plan,
      limits,
      usage,
      utilization: {
        learners: limits.learners === -1 ? 0 : (usage.learners / limits.learners) * 100,
        courses: limits.courses === -1 ? 0 : (usage.courses / limits.courses) * 100,
        dc3: limits.dc3_per_month === -1 ? 0 : (usage.dc3_this_month / limits.dc3_per_month) * 100,
        storage: (usage.storage_used_gb / limits.storage_gb) * 100,
      },
    };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed usage metrics' })
  async getUsage(@CurrentTenant() tenantId: string) {
    const usage = await this.billingService.getTenantUsage(tenantId);
    const plan = await this.billingService.getTenantPlan(tenantId);
    const limits = this.billingService.getPlanLimits(plan);

    return {
      usage,
      limits,
      checks: {
        learners: await this.billingService.checkLearnerLimit(tenantId),
        courses: await this.billingService.checkCourseLimit(tenantId),
        dc3: await this.billingService.checkDC3Limit(tenantId),
      },
    };
  }

  @Get('features')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available features for current plan' })
  async getFeatures(@CurrentTenant() tenantId: string) {
    const plan = await this.billingService.getTenantPlan(tenantId);
    const limits = this.billingService.getPlanLimits(plan);

    // All possible features with availability
    const allFeatures = [
      { id: 'basic_lms', name: 'LMS Básico', description: 'Cursos, módulos y lecciones' },
      { id: 'dc3_generation', name: 'Generación DC-3', description: 'Constancias de habilidades laborales' },
      { id: 'sirce_export', name: 'Export SIRCE', description: 'Exportación para STPS' },
      { id: 'lft_plans', name: 'Planes LFT', description: 'Planes de capacitación Ley Federal del Trabajo' },
      { id: 'open_badges', name: 'Open Badges 3.0', description: 'Credenciales verificables' },
      { id: 'basic_analytics', name: 'Analítica Básica', description: 'Reportes de progreso' },
      { id: 'advanced_analytics', name: 'Analítica Avanzada', description: 'Dashboards y métricas detalladas' },
      { id: 'custom_branding', name: 'Marca Personalizada', description: 'Logo y colores propios' },
      { id: 'api_access', name: 'Acceso API', description: 'Integración programática' },
      { id: 'ece_oc_toolkit', name: 'ECE/OC Toolkit', description: 'Herramientas para centros de evaluación' },
      { id: 'sso_saml', name: 'SSO SAML', description: 'Single Sign-On empresarial' },
      { id: 'scim_provisioning', name: 'SCIM Provisioning', description: 'Sincronización de usuarios' },
      { id: 'dedicated_support', name: 'Soporte Dedicado', description: 'Ejecutivo de cuenta asignado' },
      { id: 'sla_guarantee', name: 'SLA Garantizado', description: '99.9% uptime garantizado' },
    ];

    return allFeatures.map((feature) => ({
      ...feature,
      available: limits.features.includes(feature.id),
    }));
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create checkout session for plan upgrade' })
  async createCheckout(
    @CurrentTenant() tenantId: string,
    @Body() body: { planId: string; countryCode?: string; successUrl: string; cancelUrl: string },
  ) {
    return this.billingService.createCheckoutSession(
      tenantId,
      body.planId,
      body.countryCode || 'MX',
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get billing portal URL for subscription management' })
  async getBillingPortal(
    @CurrentTenant() tenantId: string,
    @Body() body: { returnUrl: string },
  ) {
    const url = await this.billingService.getBillingPortalUrl(tenantId, body.returnUrl);
    return { url };
  }

  @Get('limits/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check specific limit before action' })
  @ApiQuery({ name: 'type', enum: ['learners', 'courses', 'dc3'], description: 'Limit type to check' })
  async checkLimit(
    @CurrentTenant() tenantId: string,
    @Query('type') type: 'learners' | 'courses' | 'dc3',
  ) {
    switch (type) {
      case 'learners':
        return this.billingService.checkLearnerLimit(tenantId);
      case 'courses':
        return this.billingService.checkCourseLimit(tenantId);
      case 'dc3':
        return this.billingService.checkDC3Limit(tenantId);
      default:
        throw new Error(`Unknown limit type: ${type}`);
    }
  }
}

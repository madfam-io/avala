/**
 * Janua Email Service for Avala LMS
 *
 * Centralized email delivery via Janua's Resend integration.
 * Provides unified email service across all MADFAM applications.
 *
 * Avala-specific features:
 * - DC-3 certificate delivery with PDF attachments
 * - Course enrollment notifications
 * - Welcome emails for LMS users
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosError, AxiosResponse } from "axios";

// ============================================================================
// Types
// ============================================================================

export interface JanuaEmailResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  content_type?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface SendTemplateEmailOptions {
  to: string | string[];
  template: string;
  variables: Record<string, any>;
  subject?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

// ============================================================================
// Template Constants
// ============================================================================

export const JANUA_TEMPLATES = {
  // Authentication
  AUTH_WELCOME: "auth/welcome",
  AUTH_PASSWORD_RESET: "auth/password-reset",
  AUTH_EMAIL_VERIFICATION: "auth/email-verification",

  // Transactional (Avala-specific)
  TRANSACTIONAL_CERTIFICATE: "transactional/certificate",

  // Notifications
  NOTIFICATION_ALERT: "notification/alert",
} as const;

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class JanuaEmailService implements OnModuleInit {
  private readonly logger = new Logger(JanuaEmailService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly sourceApp = "avala";
  private isAvailable = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>(
      "JANUA_API_URL",
      "https://api.janua.dev",
    );
    this.apiKey = this.configService.get<string>("JANUA_INTERNAL_API_KEY", "");
  }

  async onModuleInit() {
    await this.checkHealth();
  }

  /**
   * Check if Janua email service is available
   */
  async checkHealth(): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(
        "JANUA_INTERNAL_API_KEY not configured, Janua email service disabled",
      );
      this.isAvailable = false;
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/internal/email/health`, {
          headers: this.getHeaders(),
          timeout: 5000,
        }),
      );

      this.isAvailable = response.data?.status === "healthy";
      this.logger.log(
        `Janua email service: ${this.isAvailable ? "available" : "unavailable"}`,
      );
      return this.isAvailable;
    } catch (error) {
      this.logger.warn(
        "Janua email service health check failed, will use SMTP fallback",
      );
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Check if Janua email is available (for conditional routing)
   */
  get available(): boolean {
    return this.isAvailable;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Internal-API-Key": this.apiKey,
    };
  }

  /**
   * Send a custom HTML email
   */
  async sendEmail(
    options: SendEmailOptions,
    sourceType: string = "notification",
  ): Promise<JanuaEmailResponse> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const payload = {
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from_email: options.from_email,
        from_name: options.from_name || "AVALA LMS",
        reply_to: options.reply_to,
        attachments: options.attachments,
        tags: options.tags,
        source_app: this.sourceApp,
        source_type: sourceType,
      };

      const response = (await firstValueFrom(
        this.httpService.post<JanuaEmailResponse>(
          `${this.baseUrl}/api/v1/internal/email/send`,
          payload,
          { headers: this.getHeaders(), timeout: 30000 },
        ),
      )) as AxiosResponse<JanuaEmailResponse>;

      if (response.data.success) {
        this.logger.log(
          `Email sent via Janua: to=${recipients.join(",")}, type=${sourceType}`,
        );
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.data?.["detail"] ||
        axiosError.message ||
        "Unknown error";

      this.logger.error(`Failed to send email via Janua: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send email using a registered template
   */
  async sendTemplateEmail(
    options: SendTemplateEmailOptions,
    sourceType: string = "notification",
  ): Promise<JanuaEmailResponse> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const payload = {
        to: recipients,
        template: options.template,
        variables: options.variables,
        subject: options.subject,
        from_email: options.from_email,
        from_name: options.from_name || "AVALA LMS",
        reply_to: options.reply_to,
        tags: options.tags,
        source_app: this.sourceApp,
        source_type: sourceType,
      };

      const response = (await firstValueFrom(
        this.httpService.post<JanuaEmailResponse>(
          `${this.baseUrl}/api/v1/internal/email/send-template`,
          payload,
          { headers: this.getHeaders(), timeout: 30000 },
        ),
      )) as AxiosResponse<JanuaEmailResponse>;

      if (response.data.success) {
        this.logger.log(
          `Template email sent via Janua: to=${recipients.join(",")}, template=${options.template}`,
        );
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.data?.["detail"] ||
        axiosError.message ||
        "Unknown error";

      this.logger.error(
        `Failed to send template email via Janua: ${errorMessage}`,
      );
      return { success: false, error: errorMessage };
    }
  }

  // ============================================================================
  // Avala-specific convenience methods
  // ============================================================================

  /**
   * Send welcome email to new LMS user
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    tenantName: string,
  ): Promise<JanuaEmailResponse> {
    return this.sendTemplateEmail(
      {
        to: email,
        template: JANUA_TEMPLATES.AUTH_WELCOME,
        variables: {
          user_name: firstName,
          app_name: tenantName || "AVALA LMS",
          login_url: this.configService.get(
            "NEXT_PUBLIC_APP_URL",
            "https://app.avala.mx",
          ),
          support_email: "soporte@avala.mx",
        },
      },
      "onboarding",
    );
  }

  /**
   * Send course enrollment confirmation
   * Note: Uses custom HTML since enrollment is Avala-specific
   */
  async sendEnrollmentEmail(
    email: string,
    firstName: string,
    courseTitle: string,
    courseCode: string,
    durationHours: number,
  ): Promise<JanuaEmailResponse> {
    const appUrl = this.configService.get(
      "NEXT_PUBLIC_APP_URL",
      "https://app.avala.mx",
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .course-info { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Inscripción Confirmada</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${firstName}</strong>,</p>
              <p>Te has inscrito exitosamente en el siguiente curso:</p>
              <div class="course-info">
                <h2 style="margin-top: 0; color: #10b981;">${courseTitle}</h2>
                <p><strong>Código:</strong> ${courseCode}</p>
                <p><strong>Duración:</strong> ${durationHours} horas</p>
              </div>
              <p>Puedes comenzar tu capacitación de inmediato desde la sección "Mi Aprendizaje".</p>
              <p>Al completar todas las lecciones, recibirás tu Constancia de Competencias DC-3 oficial.</p>
              <a href="${appUrl}/dashboard/learning" class="button">Ir a Mi Aprendizaje</a>
            </div>
            <div class="footer">
              <p>Este es un correo automático de AVALA LMS</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      {
        to: email,
        subject: `Inscripción Confirmada: ${courseTitle}`,
        html,
      },
      "enrollment",
    );
  }

  /**
   * Send DC-3 certificate email with PDF attachment
   */
  async sendCertificateEmail(
    email: string,
    firstName: string,
    courseTitle: string,
    folio: string,
    pdfBuffer: Buffer,
  ): Promise<JanuaEmailResponse> {
    // Convert PDF to base64
    const pdfBase64 = pdfBuffer.toString("base64");

    return this.sendTemplateEmail(
      {
        to: email,
        template: JANUA_TEMPLATES.TRANSACTIONAL_CERTIFICATE,
        variables: {
          certificate_name: `Constancia DC-3: ${courseTitle}`,
          recipient_name: firstName,
          download_url: `${this.configService.get("NEXT_PUBLIC_APP_URL")}/certificates/${folio}`,
          issue_date: new Date().toLocaleDateString("es-MX"),
        },
        subject: `Constancia DC-3 Disponible: ${courseTitle}`,
        attachments: [
          {
            filename: `DC3-${folio}.pdf`,
            content: pdfBase64,
            content_type: "application/pdf",
          },
        ],
      },
      "certificate",
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
  ): Promise<JanuaEmailResponse> {
    const resetUrl = `${this.configService.get("NEXT_PUBLIC_APP_URL")}/reset-password?token=${resetToken}`;

    return this.sendTemplateEmail(
      {
        to: email,
        template: JANUA_TEMPLATES.AUTH_PASSWORD_RESET,
        variables: {
          user_name: firstName,
          reset_link: resetUrl,
          expires_in: "1 hora",
          app_name: "AVALA LMS",
        },
      },
      "auth",
    );
  }
}

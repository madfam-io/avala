import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * MailService
 * Phase 5: Production Readiness (Mailer)
 * Handles all email notifications in the system
 */
@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    // Configure SMTP transport (defaults to Mailhog for development)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false, // true for 465, false for other ports
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
          }
        : undefined,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates in development
      },
    });

    this.logger.log(
      `Mail service initialized with SMTP host: ${this.configService.get<string>('SMTP_HOST', 'localhost')}:${this.configService.get<number>('SMTP_PORT', 1025)}`
    );
  }

  /**
   * Generic email sending method
   */
  async sendEmail({
    to,
    subject,
    html,
    attachments,
  }: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }>;
  }): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"AVALA LMS" <noreply@avala.app>'
        ),
        to,
        subject,
        html,
        attachments,
      });

      this.logger.log(`Email sent to ${to}: ${subject} (ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Welcome Email - Sent when new user is created
   */
  async sendWelcomeEmail({
    email,
    firstName,
    tenantName,
  }: {
    email: string;
    firstName: string;
    tenantName: string;
  }): Promise<void> {
    const subject = `¡Bienvenido a ${tenantName}!`;
    const html = this.getWelcomeTemplate(firstName, tenantName);

    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Enrollment Email - Sent when user enrolls in a course
   */
  async sendEnrollmentEmail({
    email,
    firstName,
    courseTitle,
    courseCode,
    durationHours,
  }: {
    email: string;
    firstName: string;
    courseTitle: string;
    courseCode: string;
    durationHours: number;
  }): Promise<void> {
    const subject = `Inscripción Confirmada: ${courseTitle}`;
    const html = this.getEnrollmentTemplate(
      firstName,
      courseTitle,
      courseCode,
      durationHours
    );

    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Certificate Email - Sent when course is completed with DC-3 PDF attached
   */
  async sendCertificateEmail({
    email,
    firstName,
    courseTitle,
    folio,
    pdfBuffer,
  }: {
    email: string;
    firstName: string;
    courseTitle: string;
    folio: string;
    pdfBuffer: Buffer;
  }): Promise<void> {
    const subject = `Constancia DC-3 Disponible: ${courseTitle}`;
    const html = this.getCertificateTemplate(firstName, courseTitle, folio);

    await this.sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `DC3-${folio}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * HTML Template: Welcome Email
   */
  private getWelcomeTemplate(firstName: string, tenantName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a ${tenantName}!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${firstName}</strong>,</p>
              <p>Tu cuenta ha sido creada exitosamente en la plataforma AVALA LMS.</p>
              <p>Ahora puedes:</p>
              <ul>
                <li>Explorar el catálogo de cursos disponibles</li>
                <li>Inscribirte en programas de capacitación</li>
                <li>Obtener constancias DC-3 oficiales</li>
                <li>Seguir tu progreso de aprendizaje</li>
              </ul>
              <p>¡Comienza tu camino de aprendizaje hoy mismo!</p>
              <a href="${this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/login" class="button">
                Iniciar Sesión
              </a>
            </div>
            <div class="footer">
              <p>Este es un correo automático de AVALA LMS</p>
              <p>${tenantName} - Sistema de Gestión de Aprendizaje</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * HTML Template: Enrollment Email
   */
  private getEnrollmentTemplate(
    firstName: string,
    courseTitle: string,
    courseCode: string,
    durationHours: number
  ): string {
    return `
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
              <a href="${this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/dashboard/learning" class="button">
                Ir a Mi Aprendizaje
              </a>
            </div>
            <div class="footer">
              <p>Este es un correo automático de AVALA LMS</p>
              <p>Sistema de Gestión de Aprendizaje</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * HTML Template: Certificate Email
   */
  private getCertificateTemplate(
    firstName: string,
    courseTitle: string,
    folio: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .certificate-badge { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .folio { font-size: 24px; font-weight: bold; color: #f59e0b; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 ¡Felicidades ${firstName}!</h1>
            </div>
            <div class="content">
              <p>Has completado exitosamente el curso:</p>
              <h2 style="color: #f59e0b; text-align: center;">${courseTitle}</h2>
              <div class="certificate-badge">
                <p style="margin: 0; color: #6b7280;">Constancia DC-3 Generada</p>
                <div class="folio">${folio}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                  Conforme al artículo 153-V de la Ley Federal del Trabajo
                </p>
              </div>
              <p>Tu Constancia de Competencias DC-3 está adjunta a este correo en formato PDF.</p>
              <p><strong>Características de tu constancia:</strong></p>
              <ul>
                <li>Código QR para verificación pública</li>
                <li>Folio único: <strong>${folio}</strong></li>
                <li>Válida ante autoridades laborales</li>
                <li>Formato oficial STPS</li>
              </ul>
              <p>Puedes verificar la autenticidad de tu constancia escaneando el código QR o visitando la sección de verificación en nuestro sitio web.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático de AVALA LMS</p>
              <p>Sistema de Gestión de Aprendizaje - Constancias DC-3 Oficiales</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

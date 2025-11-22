import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * CertificatesService
 * Phase 3-B: DC-3 Certificate Generation
 * Generates official Mexican DC-3 training certificates
 */
@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a DC-3 certificate for a completed enrollment
   * Returns PDF buffer and creates Certificate record
   */
  async generateDc3(tenantId: string, enrollmentId: string): Promise<Buffer> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Fetch deep enrollment data
    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: {
          include: {
            owner: true,
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
        certificates: {
          where: {
            revokedAt: null,
          },
          orderBy: {
            issuedAt: 'desc',
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    // Validate enrollment is completed
    if (enrollment.status !== 'COMPLETED') {
      throw new BadRequestException('Certificate can only be issued for completed courses');
    }

    // Fetch tenant data for legal fields
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Validate required legal fields
    this.validateLegalFields(enrollment, tenant);

    // Check if certificate already exists
    if (enrollment.certificates.length > 0) {
      // Certificate already exists, regenerate PDF
      const existingCert = enrollment.certificates[0];
      const pdfBuffer = await this.createDc3Pdf(enrollment, tenant, existingCert);
      return pdfBuffer;
    }

    // Generate unique folio number
    const folio = await this.generateFolio(tenantClient);

    // Create certificate record
    const certificate = await tenantClient.certificate.create({
      data: {
        enrollmentId,
        folio,
        pdfPath: null, // Will be updated after S3 upload in production
      },
    });

    // Generate PDF
    const pdfBuffer = await this.createDc3Pdf(enrollment, tenant, certificate);

    // In production, upload to S3 and update pdfPath
    // await this.uploadToS3(pdfBuffer, certificate.id);
    // await tenantClient.certificate.update({
    //   where: { id: certificate.id },
    //   data: { pdfPath: s3Key }
    // });

    return pdfBuffer;
  }

  /**
   * Validate all required legal fields are present
   */
  private validateLegalFields(enrollment: any, tenant: any): void {
    const errors: string[] = [];

    // Validate tenant fields
    if (!tenant.rfc) {
      errors.push('Tenant RFC is required');
    }
    if (!tenant.legalName) {
      errors.push('Tenant legal name is required');
    }
    if (!tenant.representativeName) {
      errors.push('Tenant representative name is required');
    }

    // Validate user fields
    if (!enrollment.user.curp) {
      errors.push('User CURP is required');
    }
    if (!enrollment.user.firstName || !enrollment.user.lastName) {
      errors.push('User full name is required');
    }

    // Validate course fields
    if (!enrollment.course.durationHours) {
      errors.push('Course duration is required');
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Cannot generate DC-3: Missing required fields: ${errors.join(', ')}`
      );
    }
  }

  /**
   * Generate sequential folio number
   */
  private async generateFolio(tenantClient: any): Promise<string> {
    // Get count of existing certificates
    const count = await tenantClient.certificate.count();
    const nextNumber = count + 1;

    // Format: DC3-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const folio = `DC3-${year}-${nextNumber.toString().padStart(6, '0')}`;

    return folio;
  }

  /**
   * Create DC-3 PDF document
   */
  private async createDc3Pdf(
    enrollment: any,
    tenant: any,
    certificate: any
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header Section
        this.renderHeader(doc, certificate.folio);

        // Title
        doc.moveDown(2);
        doc.fontSize(18).font('Helvetica-Bold').text('CONSTANCIA DE COMPETENCIAS', {
          align: 'center',
        });
        doc.fontSize(16).text('DC-3 (Formato STPS)', {
          align: 'center',
        });

        doc.moveDown(2);

        // Certificate UUID for verification
        doc.fontSize(9).font('Helvetica').text(
          `ID de Verificación: ${certificate.certificateUuid}`,
          { align: 'right' }
        );

        doc.moveDown(1);

        // Worker Information Section
        this.renderSection(doc, 'INFORMACIÓN DEL TRABAJADOR', [
          {
            label: 'Nombre Completo',
            value: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
          },
          { label: 'CURP', value: enrollment.user.curp },
          { label: 'RFC', value: enrollment.user.rfc || 'N/A' },
        ]);

        doc.moveDown(1);

        // Company Information Section
        this.renderSection(doc, 'INFORMACIÓN DE LA EMPRESA', [
          { label: 'Razón Social', value: tenant.legalName },
          { label: 'RFC', value: tenant.rfc },
          { label: 'Representante Legal', value: tenant.representativeName },
        ]);

        doc.moveDown(1);

        // Course Information Section
        this.renderSection(doc, 'INFORMACIÓN DEL CURSO', [
          { label: 'Nombre del Curso', value: enrollment.course.title },
          { label: 'Código', value: enrollment.course.code },
          {
            label: 'Duración',
            value: `${enrollment.course.durationHours} horas`,
          },
          {
            label: 'Registro STPS',
            value: enrollment.course.stpsRegistrationNumber || 'N/A',
          },
          {
            label: 'Instructor',
            value: `${enrollment.course.owner.firstName || ''} ${enrollment.course.owner.lastName || ''}`.trim() ||
              enrollment.course.owner.email,
          },
        ]);

        doc.moveDown(1);

        // Completion Information
        this.renderSection(doc, 'INFORMACIÓN DE FINALIZACIÓN', [
          {
            label: 'Fecha de Inicio',
            value: this.formatDate(enrollment.enrolledAt),
          },
          {
            label: 'Fecha de Terminación',
            value: this.formatDate(enrollment.completedAt),
          },
          {
            label: 'Fecha de Emisión',
            value: this.formatDate(certificate.issuedAt),
          },
        ]);

        doc.moveDown(2);

        // Signature Section
        doc.fontSize(10).font('Helvetica-Italic').text(
          'Se extiende la presente constancia en cumplimiento de lo establecido en el artículo 153-V de la Ley Federal del Trabajo.',
          { align: 'center' }
        );

        doc.moveDown(3);

        // Signature lines
        const signatureY = doc.y;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const signatureWidth = pageWidth / 3;

        // Instructor signature
        doc.fontSize(10).font('Helvetica');
        doc.text('_________________________', doc.page.margins.left, signatureY);
        doc.text(
          'Firma del Instructor',
          doc.page.margins.left,
          signatureY + 20,
          { width: signatureWidth, align: 'center' }
        );

        // Representative signature
        doc.text(
          '_________________________',
          doc.page.margins.left + pageWidth - signatureWidth,
          signatureY
        );
        doc.text(
          'Firma del Representante Legal',
          doc.page.margins.left + pageWidth - signatureWidth,
          signatureY + 20,
          { width: signatureWidth, align: 'center' }
        );

        // Footer
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text(
          `Este documento ha sido generado electrónicamente y puede ser verificado en línea usando el ID: ${certificate.certificateUuid}`,
          doc.page.margins.left,
          doc.page.height - 80,
          {
            align: 'center',
            width: pageWidth,
          }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render PDF header with logo and folio
   */
  private renderHeader(doc: PDFKit.PDFDocument, folio: string): void {
    doc.fontSize(12).font('Helvetica-Bold').text('AVALA LMS', 50, 50);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Folio: ${folio}`, 50, 65);

    doc
      .fontSize(8)
      .text(`Fecha: ${this.formatDate(new Date())}`, doc.page.width - 150, 50, {
        width: 100,
        align: 'right',
      });
  }

  /**
   * Render a section with title and key-value pairs
   */
  private renderSection(
    doc: PDFKit.PDFDocument,
    title: string,
    fields: Array<{ label: string; value: string }>
  ): void {
    const startY = doc.y;

    // Section title with background
    doc
      .rect(50, startY, doc.page.width - 100, 20)
      .fillAndStroke('#E0E0E0', '#CCCCCC');

    doc
      .fillColor('#000000')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(title, 55, startY + 5);

    doc.moveDown(0.5);

    // Fields
    doc.fontSize(10).font('Helvetica');
    fields.forEach((field) => {
      const y = doc.y;
      doc.font('Helvetica-Bold').text(`${field.label}:`, 55, y, { width: 150 });
      doc.font('Helvetica').text(field.value, 210, y, {
        width: doc.page.width - 260,
      });
      doc.moveDown(0.5);
    });
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get certificate by enrollment ID
   */
  async getCertificate(tenantId: string, enrollmentId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const certificate = await tenantClient.certificate.findFirst({
      where: {
        enrollmentId,
        revokedAt: null,
      },
      include: {
        enrollment: {
          include: {
            user: true,
            course: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate for enrollment ${enrollmentId} not found`
      );
    }

    return certificate;
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(
    tenantId: string,
    certificateId: string,
    revokedBy: string,
    reason: string
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const certificate = await tenantClient.certificate.update({
      where: { id: certificateId },
      data: {
        revokedAt: new Date(),
        revokedBy,
        revokedReason: reason,
      },
    });

    return certificate;
  }
}

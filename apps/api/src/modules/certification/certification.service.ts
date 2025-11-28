import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as crypto from "crypto";
import PDFDocument from "pdfkit";
import * as QRCode from "qrcode";
import {
  ExportFormat,
  ExportDC3Dto,
  DC3ExportResultDto,
} from "./dto/certification.dto";

/**
 * Certification Service
 * Handles DC-3 certificate generation and export using existing DC3 model
 */
@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // DC-3 CRUD (using existing DC3 model)
  // ============================================

  async createDC3(data: {
    tenantId: string;
    traineeId: string;
    courseId: string;
  }) {
    const serial = this.generateCertificateNumber();

    const dc3 = await this.prisma.dC3.create({
      data: {
        tenantId: data.tenantId,
        traineeId: data.traineeId,
        courseId: data.courseId,
        serial,
        status: "ISSUED",
      },
      include: {
        course: true,
        tenant: true,
      },
    });

    this.logger.log(`Created DC3: ${dc3.id} with serial ${serial}`);
    return dc3;
  }

  async getDC3(id: string) {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            standards: true,
          },
        },
        tenant: true,
      },
    });

    if (!dc3) {
      throw new NotFoundException(`DC3 ${id} not found`);
    }

    return dc3;
  }

  async getDC3BySerial(serial: string) {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { serial },
      include: {
        course: true,
        tenant: true,
      },
    });

    if (!dc3) {
      throw new NotFoundException(`DC3 with serial ${serial} not found`);
    }

    return dc3;
  }

  async getDC3List(query: {
    tenantId?: string;
    traineeId?: string;
    courseId?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.traineeId) where.traineeId = query.traineeId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.dC3.findMany({
        where,
        skip: query.skip || 0,
        take: query.limit || 20,
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
        },
        orderBy: { issuedAt: "desc" },
      }),
      this.prisma.dC3.count({ where }),
    ]);

    return { data, total, skip: query.skip || 0, limit: query.limit || 20 };
  }

  async revokeDC3(id: string, reason?: string) {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { id },
    });

    if (!dc3) {
      throw new NotFoundException(`DC3 ${id} not found`);
    }

    if (dc3.status === "REVOKED") {
      throw new BadRequestException("DC3 already revoked");
    }

    const updated = await this.prisma.dC3.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    this.logger.log(`Revoked DC3 ${id}: ${reason || "No reason provided"}`);
    return updated;
  }

  // ============================================
  // DC-3 EXPORT
  // ============================================

  async exportDC3(dto: ExportDC3Dto): Promise<DC3ExportResultDto> {
    // Get DC3 record and related data
    const dc3 = await this.getDC3(dto.certificationId);

    // Get trainee user data
    const trainee = await this.prisma.user.findUnique({
      where: { id: dc3.traineeId },
    });

    if (!trainee) {
      throw new NotFoundException(`Trainee not found`);
    }

    const baseFilename = `DC3_${dc3.serial}`;

    // Build data for export
    // Access related data with type assertions since we know includes worked
    const dc3Data = dc3 as typeof dc3 & {
      tenant: { name: string; rfc?: string; address?: string };
      course: {
        title: string;
        durationHours: number;
        standards?: { code: string }[];
      };
    };

    const exportData = {
      certificateNumber: dc3.serial,
      worker: {
        nombre: trainee.firstName || "",
        apellidoPaterno: trainee.lastName || "",
        apellidoMaterno: "",
        curp: (trainee as Record<string, unknown>).curp || "",
        rfc: (trainee as Record<string, unknown>).rfc || "",
        puesto: (trainee as Record<string, unknown>).puesto || "",
      },
      company: {
        razonSocial: dc3Data.tenant?.name || "",
        rfc: dc3Data.tenant?.rfc || "",
        domicilio: dc3Data.tenant?.address || "",
      },
      course: {
        nombreCurso: dc3Data.course?.title || "",
        ecCode: dc3Data.course?.standards?.[0]?.code || "",
        duracionHoras: dc3Data.course?.durationHours || 0,
        modalidad: "Presencial",
        fechaInicio: dc3.issuedAt.toISOString(),
        fechaTermino: dc3.issuedAt.toISOString(),
      },
      certificationDate: dc3.issuedAt,
    };

    switch (dto.format) {
      case ExportFormat.PDF:
        return this.generateDC3PDF(exportData, dto, baseFilename, dc3.id);

      case ExportFormat.XML:
        return this.generateDC3XML(exportData, baseFilename, dc3.id);

      case ExportFormat.JSON:
        return this.generateDC3JSON(exportData, baseFilename, dc3.id);

      default:
        throw new BadRequestException(`Unsupported format: ${dto.format}`);
    }
  }

  private async generateDC3PDF(
    data: Record<string, unknown>,
    dto: ExportDC3Dto,
    baseFilename: string,
    certificationId: string,
  ): Promise<DC3ExportResultDto> {
    const pdfBuffer = await this.buildDC3PDF({
      ...data,
      includeQRCode: dto.includeQRCode,
      includeSignature: dto.includeSignature,
    });

    const content = pdfBuffer.toString("base64");

    return {
      certificationId,
      format: ExportFormat.PDF,
      content,
      filename: `${baseFilename}.pdf`,
      mimeType: "application/pdf",
      generatedAt: new Date(),
    };
  }

  private async buildDC3PDF(data: Record<string, unknown>): Promise<Buffer> {
    const worker = data.worker as Record<string, unknown>;
    const company = data.company as Record<string, unknown>;
    const course = data.course as Record<string, unknown>;
    const certificateNumber = data.certificateNumber as string;
    const certificationDate = data.certificationDate as Date;
    const includeQRCode = data.includeQRCode as boolean;

    return new Promise(async (resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES", {
            align: "center",
          });
        doc.fontSize(14).text("DC-3", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Folio: ${certificateNumber}`, { align: "center" });
        doc.moveDown();

        // QR Code (if requested)
        if (includeQRCode) {
          try {
            const qrDataUrl = await QRCode.toDataURL(
              `DC3:${certificateNumber}`,
              { width: 80 },
            );
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
            doc.image(qrBuffer, doc.page.width - 130, 50, { width: 80 });
          } catch (qrError) {
            this.logger.warn("Failed to generate QR code", qrError);
          }
        }

        // Divider line
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown();

        // Section I: Worker Data
        this.addPDFSection(doc, "I. DATOS DEL TRABAJADOR");
        this.addPDFField(
          doc,
          "Nombre completo:",
          `${worker.nombre} ${worker.apellidoPaterno} ${worker.apellidoMaterno}`,
        );
        this.addPDFField(doc, "CURP:", (worker.curp as string) || "N/A");
        if (worker.rfc) this.addPDFField(doc, "RFC:", worker.rfc as string);
        this.addPDFField(
          doc,
          "Ocupación/Puesto:",
          (worker.puesto as string) || "N/A",
        );
        doc.moveDown();

        // Section II: Company Data
        this.addPDFSection(doc, "II. DATOS DE LA EMPRESA");
        this.addPDFField(
          doc,
          "Razón Social:",
          (company.razonSocial as string) || "N/A",
        );
        this.addPDFField(doc, "RFC:", (company.rfc as string) || "N/A");
        if (company.domicilio)
          this.addPDFField(doc, "Domicilio:", company.domicilio as string);
        doc.moveDown();

        // Section III: Course Data
        this.addPDFSection(doc, "III. DATOS DEL CURSO");
        this.addPDFField(
          doc,
          "Nombre del curso:",
          course.nombreCurso as string,
        );
        if (course.ecCode)
          this.addPDFField(
            doc,
            "Estándar de Competencia:",
            course.ecCode as string,
          );
        this.addPDFField(doc, "Duración:", `${course.duracionHoras} horas`);
        this.addPDFField(doc, "Modalidad:", course.modalidad as string);

        const fechaInicio = new Date(
          course.fechaInicio as string,
        ).toLocaleDateString("es-MX");
        const fechaTermino = new Date(
          course.fechaTermino as string,
        ).toLocaleDateString("es-MX");
        this.addPDFField(
          doc,
          "Período:",
          `Del ${fechaInicio} al ${fechaTermino}`,
        );
        doc.moveDown(2);

        // Signatures section
        const signatureY = doc.y + 40;
        const pageWidth = doc.page.width - 100;

        // Left signature (Instructor)
        doc
          .moveTo(70, signatureY + 30)
          .lineTo(70 + pageWidth / 2 - 40, signatureY + 30)
          .stroke();
        doc.fontSize(9).text("Instructor", 70, signatureY + 35, {
          width: pageWidth / 2 - 40,
          align: "center",
        });
        doc
          .fontSize(8)
          .text("Nombre y firma del instructor", 70, signatureY + 48, {
            width: pageWidth / 2 - 40,
            align: "center",
          });

        // Right signature (Company Representative)
        const rightX = 70 + pageWidth / 2 + 20;
        doc
          .moveTo(rightX, signatureY + 30)
          .lineTo(rightX + pageWidth / 2 - 40, signatureY + 30)
          .stroke();
        doc.fontSize(9).text("Representante Legal", rightX, signatureY + 35, {
          width: pageWidth / 2 - 40,
          align: "center",
        });
        doc
          .fontSize(8)
          .text(
            "Nombre y firma del patrón o representante legal",
            rightX,
            signatureY + 48,
            { width: pageWidth / 2 - 40, align: "center" },
          );

        // Footer
        doc.fontSize(7).fillColor("#666666");
        doc.text(
          "Este documento cumple con lo establecido en los artículos 153-A a 153-X de la Ley Federal del Trabajo.",
          50,
          doc.page.height - 80,
          { align: "center", width: doc.page.width - 100 },
        );

        const expeditionDate = certificationDate
          ? new Date(certificationDate).toLocaleDateString("es-MX")
          : new Date().toLocaleDateString("es-MX");
        doc.text(
          `Fecha de expedición: ${expeditionDate}`,
          50,
          doc.page.height - 65,
          {
            align: "center",
            width: doc.page.width - 100,
          },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addPDFSection(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000");
    doc.rect(50, doc.y, doc.page.width - 100, 18).fill("#f0f0f0");
    doc.fillColor("#000000").text(title, 55, doc.y + 4);
    doc.moveDown(0.8);
    doc.font("Helvetica");
  }

  private addPDFField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
  ): void {
    const labelWidth = 150;
    const startY = doc.y;

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(label, 55, startY, { width: labelWidth, continued: false });
    doc.font("Helvetica").text(value || "N/A", 55 + labelWidth, startY, {
      width: doc.page.width - 155 - labelWidth,
    });

    if (doc.y <= startY + 12) {
      doc.y = startY + 14;
    }
  }

  private async generateDC3XML(
    data: Record<string, unknown>,
    baseFilename: string,
    certificationId: string,
  ): Promise<DC3ExportResultDto> {
    const worker = data.worker as Record<string, unknown>;
    const company = data.company as Record<string, unknown>;
    const course = data.course as Record<string, unknown>;
    const certificateNumber = data.certificateNumber as string;
    const certificationDate = data.certificationDate as Date;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DC3 xmlns="http://www.stps.gob.mx/DC3" version="1.0">
  <Folio>${certificateNumber}</Folio>
  <FechaExpedicion>${certificationDate?.toISOString() || new Date().toISOString()}</FechaExpedicion>

  <Trabajador>
    <CURP>${worker.curp || ""}</CURP>
    <Nombre>${worker.nombre || ""}</Nombre>
    <ApellidoPaterno>${worker.apellidoPaterno || ""}</ApellidoPaterno>
    <ApellidoMaterno>${worker.apellidoMaterno || ""}</ApellidoMaterno>
    <RFC>${worker.rfc || ""}</RFC>
    <Puesto>${worker.puesto || ""}</Puesto>
  </Trabajador>

  <Empresa>
    <RFC>${company.rfc || ""}</RFC>
    <RazonSocial>${this.escapeXml((company.razonSocial as string) || "")}</RazonSocial>
    <Domicilio>${this.escapeXml((company.domicilio as string) || "")}</Domicilio>
  </Empresa>

  <Curso>
    <Nombre>${this.escapeXml((course.nombreCurso as string) || "")}</Nombre>
    <EstandarCompetencia>${course.ecCode || ""}</EstandarCompetencia>
    <DuracionHoras>${course.duracionHoras || 0}</DuracionHoras>
    <Modalidad>${course.modalidad || ""}</Modalidad>
    <FechaInicio>${course.fechaInicio || ""}</FechaInicio>
    <FechaTermino>${course.fechaTermino || ""}</FechaTermino>
  </Curso>
</DC3>`;

    return {
      certificationId,
      format: ExportFormat.XML,
      xmlContent: xml,
      filename: `${baseFilename}.xml`,
      mimeType: "application/xml",
      generatedAt: new Date(),
    };
  }

  private async generateDC3JSON(
    data: Record<string, unknown>,
    baseFilename: string,
    certificationId: string,
  ): Promise<DC3ExportResultDto> {
    return {
      certificationId,
      format: ExportFormat.JSON,
      jsonData: data,
      filename: `${baseFilename}.json`,
      mimeType: "application/json",
      generatedAt: new Date(),
    };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateCertificateNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `DC3-${year}${month}-${random}`;
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getDC3Stats(tenantId?: string) {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    const [total, issued, revoked] = await Promise.all([
      this.prisma.dC3.count({ where }),
      this.prisma.dC3.count({ where: { ...where, status: "ISSUED" } }),
      this.prisma.dC3.count({ where: { ...where, status: "REVOKED" } }),
    ]);

    return {
      total,
      byStatus: { ISSUED: issued, REVOKED: revoked },
    };
  }
}

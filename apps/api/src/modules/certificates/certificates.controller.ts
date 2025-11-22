import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * CertificatesController
 * Phase 3-B: DC-3 Certificate Management
 */
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * POST /certificates/enrollments/:enrollmentId/generate
   * Generate DC-3 certificate for completed enrollment
   */
  @Post('enrollments/:enrollmentId/generate')
  async generateCertificate(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Res() res: Response,
  ) {
    const tenantId = req.user.tenantId;

    const pdfBuffer = await this.certificatesService.generateDc3(
      tenantId,
      enrollmentId,
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DC3-Certificate-${enrollmentId}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  }

  /**
   * GET /certificates/enrollments/:enrollmentId
   * Get certificate metadata for an enrollment
   */
  @Get('enrollments/:enrollmentId')
  async getCertificate(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.certificatesService.getCertificate(tenantId, enrollmentId);
  }

  /**
   * GET /certificates/enrollments/:enrollmentId/download
   * Download existing certificate PDF
   */
  @Get('enrollments/:enrollmentId/download')
  async downloadCertificate(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Res() res: Response,
  ) {
    const tenantId = req.user.tenantId;

    // This will regenerate the PDF from the certificate record
    const pdfBuffer = await this.certificatesService.generateDc3(
      tenantId,
      enrollmentId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DC3-Certificate-${enrollmentId}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  }

  /**
   * POST /certificates/:certificateId/revoke
   * Revoke a certificate
   */
  @Post(':certificateId/revoke')
  async revokeCertificate(
    @Req() req: any,
    @Param('certificateId') certificateId: string,
    @Body() body: { reason: string },
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.certificatesService.revokeCertificate(
      tenantId,
      certificateId,
      userId,
      body.reason,
    );
  }
}

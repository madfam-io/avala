import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CertificationService } from "./certification.service";
import { ExportDC3Dto } from "./dto/certification.dto";

@ApiTags("Certification")
@Controller("certification")
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  // ============================================
  // DC-3 CRUD
  // ============================================

  @Post("dc3")
  @ApiOperation({ summary: "Create a new DC-3 certificate" })
  @ApiResponse({ status: 201, description: "DC-3 created successfully" })
  async createDC3(
    @Body()
    body: {
      tenantId: string;
      traineeId: string;
      courseId: string;
    },
  ) {
    return this.certificationService.createDC3(body);
  }

  @Get("dc3")
  @ApiOperation({ summary: "List DC-3 certificates" })
  @ApiResponse({ status: 200, description: "List of DC-3 certificates" })
  async getDC3List(
    @Query("tenantId") tenantId?: string,
    @Query("traineeId") traineeId?: string,
    @Query("courseId") courseId?: string,
    @Query("status") status?: string,
    @Query("skip") skip?: number,
    @Query("limit") limit?: number,
  ) {
    return this.certificationService.getDC3List({
      tenantId,
      traineeId,
      courseId,
      status,
      skip: skip ? Number(skip) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("dc3/:id")
  @ApiOperation({ summary: "Get DC-3 by ID" })
  @ApiResponse({ status: 200, description: "DC-3 details" })
  async getDC3(@Param("id") id: string) {
    return this.certificationService.getDC3(id);
  }

  @Get("dc3/serial/:serial")
  @ApiOperation({ summary: "Get DC-3 by serial number" })
  @ApiResponse({ status: 200, description: "DC-3 details" })
  async getDC3BySerial(@Param("serial") serial: string) {
    return this.certificationService.getDC3BySerial(serial);
  }

  @Patch("dc3/:id/revoke")
  @ApiOperation({ summary: "Revoke a DC-3 certificate" })
  @ApiResponse({ status: 200, description: "DC-3 revoked successfully" })
  async revokeDC3(@Param("id") id: string, @Body() body: { reason?: string }) {
    return this.certificationService.revokeDC3(id, body.reason);
  }

  // ============================================
  // DC-3 EXPORT
  // ============================================

  @Post("dc3/export")
  @ApiOperation({ summary: "Export DC-3 in various formats (PDF, XML, JSON)" })
  @ApiResponse({ status: 200, description: "Exported DC-3 data" })
  async exportDC3(@Body() dto: ExportDC3Dto) {
    return this.certificationService.exportDC3(dto);
  }

  // ============================================
  // STATISTICS
  // ============================================

  @Get("stats")
  @ApiOperation({ summary: "Get DC-3 statistics" })
  @ApiResponse({ status: 200, description: "DC-3 statistics" })
  async getStats(@Query("tenantId") tenantId?: string) {
    return this.certificationService.getDC3Stats(tenantId);
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  CentroQueryDto,
  CertificadorQueryDto,
  RenecECQueryDto,
  RenecSearchDto,
  RenecSearchResultDto,
  RenecStatsDto,
  HarvestStatus,
} from "./dto/renec.dto";

@Injectable()
export class RenecService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CENTROS (Evaluation Centers)
  // ============================================

  async getCentros(query: CentroQueryDto) {
    const {
      search,
      estadoInegi,
      municipio,
      certificadorId,
      ecStandardCode,
      skip,
      limit,
    } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { direccion: { contains: search, mode: "insensitive" } },
      ];
    }

    if (estadoInegi) where.estadoInegi = estadoInegi;
    if (municipio)
      where.municipio = { contains: municipio, mode: "insensitive" };
    if (certificadorId) where.certifierId = certificadorId;

    // Filter by EC standard through relationship
    if (ecStandardCode) {
      where.offerings = {
        some: { ec: { ecClave: ecStandardCode } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.renecCenter.findMany({
        where,
        skip: skip || 0,
        take: limit || 100,
        include: {
          certifier: {
            select: { certId: true, razonSocial: true, nombreComercial: true },
          },
          offerings: {
            select: { ec: { select: { ecClave: true, titulo: true } } },
          },
        },
        orderBy: { nombre: "asc" },
      }),
      this.prisma.renecCenter.count({ where }),
    ]);

    return { data, total, skip: skip || 0, limit: limit || 100 };
  }

  async getCentroById(centerId: string) {
    const centro = await this.prisma.renecCenter.findUnique({
      where: { centerId },
      include: {
        certifier: true,
        offerings: {
          include: { ec: true },
        },
      },
    });

    if (!centro) {
      throw new NotFoundException(`Centro ${centerId} not found`);
    }

    return centro;
  }

  // ============================================
  // CERTIFICADORES
  // ============================================

  async getCertificadores(query: CertificadorQueryDto) {
    const { search, tipo, estadoInegi, ecStandardCode, skip, limit } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: "insensitive" } },
        { nombreComercial: { contains: search, mode: "insensitive" } },
        { representanteLegal: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tipo) where.tipo = tipo;
    if (estadoInegi) where.estadoInegi = estadoInegi;

    // Filter by EC standard through accreditations
    if (ecStandardCode) {
      where.accreditations = {
        some: { ec: { ecClave: ecStandardCode } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.renecCertifier.findMany({
        where,
        skip: skip || 0,
        take: limit || 100,
        include: {
          centers: {
            select: { centerId: true, nombre: true, estado: true },
          },
        },
        orderBy: { razonSocial: "asc" },
      }),
      this.prisma.renecCertifier.count({ where }),
    ]);

    return { data, total, skip: skip || 0, limit: limit || 100 };
  }

  async getCertificadorById(certId: string) {
    const certificador = await this.prisma.renecCertifier.findUnique({
      where: { certId },
      include: {
        centers: true,
        accreditations: {
          include: { ec: true },
        },
      },
    });

    if (!certificador) {
      throw new NotFoundException(`Certificador ${certId} not found`);
    }

    return certificador;
  }

  // ============================================
  // EC STANDARDS (from RENEC)
  // ============================================

  async getRenecECStandards(query: RenecECQueryDto) {
    const { search, sector, vigente, skip, limit } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { ecClave: { contains: search, mode: "insensitive" } },
        { titulo: { contains: search, mode: "insensitive" } },
        { proposito: { contains: search, mode: "insensitive" } },
      ];
    }

    if (sector) where.sector = { contains: sector, mode: "insensitive" };
    if (typeof vigente === "boolean") where.vigente = vigente;

    const [data, total] = await Promise.all([
      this.prisma.renecEC.findMany({
        where,
        skip: skip || 0,
        take: limit || 100,
        include: {
          centerOfferings: {
            select: {
              center: {
                select: { centerId: true, nombre: true, estado: true },
              },
            },
          },
        },
        orderBy: { ecClave: "asc" },
      }),
      this.prisma.renecEC.count({ where }),
    ]);

    return { data, total, skip: skip || 0, limit: limit || 100 };
  }

  async getRenecECById(idOrClave: string) {
    // Try to find by UUID first, then by ecClave
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrClave);

    const ecStandard = await this.prisma.renecEC.findFirst({
      where: isUuid
        ? { id: idOrClave }
        : { ecClave: idOrClave },
      include: {
        centerOfferings: {
          include: { center: true },
        },
        accreditations: {
          include: { certifier: true },
        },
      },
    });

    if (!ecStandard) {
      throw new NotFoundException(`EC Standard ${idOrClave} not found`);
    }

    return ecStandard;
  }

  async getSectors(): Promise<{ sector: string; count: number }[]> {
    const sectors = await this.prisma.renecEC.groupBy({
      by: ["sector"],
      _count: { sector: true },
      where: { sector: { not: null } },
      orderBy: { _count: { sector: "desc" } },
    });

    return sectors
      .filter((s) => s.sector !== null)
      .map((s) => ({
        sector: s.sector as string,
        count: s._count.sector,
      }));
  }

  // ============================================
  // GLOBAL SEARCH
  // ============================================

  async search(
    query: RenecSearchDto,
  ): Promise<{ data: RenecSearchResultDto[]; total: number }> {
    const { q, type, skip, limit } = query;
    const results: RenecSearchResultDto[] = [];

    // Search centros
    if (!type || type === "centro") {
      const centros = await this.prisma.renecCenter.findMany({
        where: {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { direccion: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 20,
      });

      centros.forEach((c) => {
        results.push({
          id: c.centerId,
          type: "centro",
          title: c.nombre,
          subtitle: undefined,
          location: c.estado || undefined,
          score: this.calculateSearchScore(q, c.nombre),
        });
      });
    }

    // Search certificadores
    if (!type || type === "certificador") {
      const certificadores = await this.prisma.renecCertifier.findMany({
        where: {
          OR: [
            { razonSocial: { contains: q, mode: "insensitive" } },
            { nombreComercial: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 20,
      });

      certificadores.forEach((c) => {
        results.push({
          id: c.certId,
          type: "certificador",
          title: c.razonSocial,
          subtitle: c.nombreComercial || undefined,
          location: c.estado || undefined,
          score: this.calculateSearchScore(q, c.razonSocial),
        });
      });
    }

    // Search EC standards
    if (!type || type === "ec") {
      const ecStandards = await this.prisma.renecEC.findMany({
        where: {
          OR: [
            { ecClave: { contains: q, mode: "insensitive" } },
            { titulo: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 20,
      });

      ecStandards.forEach((e) => {
        results.push({
          id: e.ecClave,
          type: "ec",
          title: `${e.ecClave} - ${e.titulo}`,
          subtitle: e.sector || undefined,
          score: this.calculateSearchScore(q, e.ecClave + " " + e.titulo),
        });
      });
    }

    // Sort by score and paginate
    results.sort((a, b) => b.score - a.score);
    const total = results.length;
    const paginated = results.slice(skip || 0, (skip || 0) + (limit || 50));

    return { data: paginated, total };
  }

  private calculateSearchScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower === queryLower) return 100;

    // Starts with query
    if (textLower.startsWith(queryLower)) return 90;

    // Contains query as word
    if (
      textLower.includes(` ${queryLower}`) ||
      textLower.includes(`${queryLower} `)
    )
      return 80;

    // Contains query
    if (textLower.includes(queryLower)) return 70;

    // Fuzzy match (simple)
    const queryWords = queryLower.split(/\s+/);
    const matchedWords = queryWords.filter((w) => textLower.includes(w));
    return (matchedWords.length / queryWords.length) * 60;
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(): Promise<RenecStatsDto> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCentros,
      totalCertificadores,
      totalECStandards,
      freshCentros,
      freshCertificadores,
      freshECStandards,
      lastSync,
    ] = await Promise.all([
      this.prisma.renecCenter.count(),
      this.prisma.renecCertifier.count(),
      this.prisma.renecEC.count(),
      this.prisma.renecCenter.count({
        where: { lastSyncedAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.renecCertifier.count({
        where: { lastSyncedAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.renecEC.count({
        where: { lastSyncedAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.renecSyncJob.findFirst({
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return {
      totalCentros,
      totalCertificadores,
      totalECStandards,
      totalSectores: 0, // Sectors are not a separate table
      lastHarvestDate: lastSync?.completedAt || null,
      lastHarvestStatus: (lastSync?.status as HarvestStatus) || null,
      dataFreshness: {
        centros:
          totalCentros > 0
            ? Math.round((freshCentros / totalCentros) * 100)
            : 0,
        certificadores:
          totalCertificadores > 0
            ? Math.round((freshCertificadores / totalCertificadores) * 100)
            : 0,
        ecStandards:
          totalECStandards > 0
            ? Math.round((freshECStandards / totalECStandards) * 100)
            : 0,
      },
    };
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  async exportCentros(format: "json" | "csv" = "json") {
    const centros = await this.prisma.renecCenter.findMany({
      include: {
        certifier: { select: { razonSocial: true, nombreComercial: true } },
        offerings: {
          select: { ec: { select: { ecClave: true, titulo: true } } },
        },
      },
    });

    if (format === "csv") {
      return this.toCsv(centros, [
        "centerId",
        "nombre",
        "estado",
        "municipio",
        "direccion",
        "telefono",
        "email",
      ]);
    }

    return centros;
  }

  async exportCertificadores(format: "json" | "csv" = "json") {
    const certificadores = await this.prisma.renecCertifier.findMany();

    if (format === "csv") {
      return this.toCsv(certificadores, [
        "certId",
        "tipo",
        "razonSocial",
        "nombreComercial",
        "estado",
        "telefono",
        "email",
        "representanteLegal",
      ]);
    }

    return certificadores;
  }

  async exportECStandards(format: "json" | "csv" = "json") {
    const ecStandards = await this.prisma.renecEC.findMany();

    if (format === "csv") {
      return this.toCsv(ecStandards, [
        "ecClave",
        "titulo",
        "version",
        "vigente",
        "sector",
        "nivelCompetencia",
      ]);
    }

    return ecStandards;
  }

  private toCsv(data: Record<string, unknown>[], columns: string[]): string {
    const header = columns.join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "";
          if (
            typeof val === "string" &&
            (val.includes(",") || val.includes('"'))
          ) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        })
        .join(","),
    );
    return [header, ...rows].join("\n");
  }
}

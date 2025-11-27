/**
 * RENEC API Router - Enhanced for RENEC Explorer
 *
 * Public endpoints for browsing EC standards, certifiers, and centers.
 * Admin endpoints for sync operations.
 * Designed to be a better alternative to the government CONOCER/RENEC website.
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { PrismaClient, Prisma } from "@prisma/client";
import { RenecSyncService } from "../services/renec/sync.service";
import {
  SchedulerService,
  createScheduler,
  type SchedulerConfig,
} from "../services/scheduler.service";

// ============================================
// Query Schemas
// ============================================

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Enhanced EC search schema
const ecSearchSchema = paginationSchema.extend({
  // Text search
  q: z.string().optional(), // Full-text search across code, title, proposito

  // Filters
  vigente: z.enum(["true", "false", "all"]).default("all"),
  sector: z.string().optional(),
  nivelCompetencia: z.coerce.number().min(1).max(5).optional(),

  // Sorting
  sortBy: z
    .enum(["ecClave", "titulo", "fechaPublicacion", "lastSyncedAt"])
    .default("ecClave"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),

  // Relationship filters
  hasCertifiers: z.enum(["true", "false"]).optional(),
  hasCenters: z.enum(["true", "false"]).optional(),
});

// Enhanced certifier search schema
const certifierSearchSchema = paginationSchema.extend({
  // Text search
  q: z.string().optional(),

  // Filters
  tipo: z.enum(["ECE", "OC", "all"]).default("all"),
  activo: z.enum(["true", "false", "all"]).default("true"),
  estado: z.string().optional(),
  estadoInegi: z.string().optional(),

  // EC filter - find certifiers that offer specific EC
  ecCode: z.string().optional(),

  // Sorting
  sortBy: z
    .enum(["razonSocial", "estado", "lastSyncedAt"])
    .default("razonSocial"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Enhanced center search schema
const centerSearchSchema = paginationSchema.extend({
  // Text search
  q: z.string().optional(),

  // Filters
  activo: z.enum(["true", "false", "all"]).default("true"),
  estado: z.string().optional(),
  estadoInegi: z.string().optional(),
  municipio: z.string().optional(),
  certifierId: z.string().uuid().optional(),

  // EC filter - find centers that offer specific EC
  ecCode: z.string().optional(),

  // Geo filters (for map integration)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(50).optional(),

  // Sorting
  sortBy: z
    .enum(["nombre", "estado", "municipio", "lastSyncedAt", "distance"])
    .default("nombre"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Geo search schema for nearby centers
const geoSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(1).max(500).default(50),
  limit: z.coerce.number().min(1).max(100).default(20),
  ecCode: z.string().optional(),
  activo: z.enum(["true", "false", "all"]).default("true"),
});

// Autocomplete schema
const autocompleteSchema = z.object({
  q: z.string().min(2),
  type: z.enum(["ec", "certifier", "center", "all"]).default("all"),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// Stats schema
const statsSchema = z.object({
  estado: z.string().optional(),
});

// Haversine formula for distance calculation (km)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Approximate bounding box for initial filtering (faster than full distance calc)
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

// Store scheduler instance globally for the router
let schedulerInstance: SchedulerService | null = null;

export function createRenecRouter(
  prisma: PrismaClient,
  schedulerConfig?: Partial<SchedulerConfig>,
) {
  const router = new Hono();
  const syncService = new RenecSyncService(prisma);

  // Initialize scheduler if not already done
  if (!schedulerInstance) {
    schedulerInstance = createScheduler(prisma, schedulerConfig);
  }

  // ============================================
  // Public Stats & Overview (for landing page)
  // ============================================

  /**
   * GET /renec/stats
   * Get overall RENEC statistics for dashboard/landing
   */
  router.get("/stats", zValidator("query", statsSchema), async (c) => {
    const { estado } = c.req.valid("query");

    const estadoFilter = estado
      ? { estado: { contains: estado, mode: "insensitive" as const } }
      : {};

    const [
      totalEC,
      activeEC,
      totalCertifiers,
      activeCertifiers,
      totalCenters,
      activeCenters,
      ecBySector,
      certifiersByState,
      centersByState,
      lastSync,
    ] = await Promise.all([
      prisma.renecEC.count(),
      prisma.renecEC.count({ where: { vigente: true } }),
      prisma.renecCertifier.count({ where: estadoFilter }),
      prisma.renecCertifier.count({ where: { activo: true, ...estadoFilter } }),
      prisma.renecCenter.count({ where: estadoFilter }),
      prisma.renecCenter.count({ where: { activo: true, ...estadoFilter } }),
      prisma.renecEC.groupBy({
        by: ["sector"],
        _count: { id: true },
        where: { vigente: true, sector: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.renecCertifier.groupBy({
        by: ["estado"],
        _count: { id: true },
        where: { activo: true, estado: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.renecCenter.groupBy({
        by: ["estado"],
        _count: { id: true },
        where: { activo: true, estado: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.renecSyncJob.findFirst({
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true, jobType: true },
      }),
    ]);

    return c.json({
      overview: {
        ecStandards: { total: totalEC, active: activeEC },
        certifiers: { total: totalCertifiers, active: activeCertifiers },
        centers: { total: totalCenters, active: activeCenters },
        lastSyncAt: lastSync?.completedAt || null,
      },
      distributions: {
        ecBySector: ecBySector.map((s) => ({
          sector: s.sector || "Sin sector",
          count: s._count.id,
        })),
        certifiersByState: certifiersByState.map((s) => ({
          estado: s.estado || "Sin estado",
          count: s._count.id,
        })),
        centersByState: centersByState.map((s) => ({
          estado: s.estado || "Sin estado",
          count: s._count.id,
        })),
      },
    });
  });

  /**
   * GET /renec/autocomplete
   * Autocomplete search across EC, certifiers, and centers
   */
  router.get(
    "/autocomplete",
    zValidator("query", autocompleteSchema),
    async (c) => {
      const { q, type, limit } = c.req.valid("query");
      const searchTerm = q.toLowerCase();

      const results: {
        ec: Array<{ id: string; code: string; title: string }>;
        certifiers: Array<{
          id: string;
          name: string;
          type: string;
          estado: string | null;
        }>;
        centers: Array<{
          id: string;
          name: string;
          estado: string | null;
          municipio: string | null;
        }>;
      } = { ec: [], certifiers: [], centers: [] };

      const searchPromises: Promise<void>[] = [];

      if (type === "all" || type === "ec") {
        searchPromises.push(
          prisma.renecEC
            .findMany({
              where: {
                vigente: true,
                OR: [
                  { ecClave: { contains: searchTerm, mode: "insensitive" } },
                  { titulo: { contains: searchTerm, mode: "insensitive" } },
                ],
              },
              select: { id: true, ecClave: true, titulo: true },
              take: limit,
              orderBy: { ecClave: "asc" },
            })
            .then((items) => {
              results.ec = items.map((i) => ({
                id: i.id,
                code: i.ecClave,
                title: i.titulo,
              }));
            }),
        );
      }

      if (type === "all" || type === "certifier") {
        searchPromises.push(
          prisma.renecCertifier
            .findMany({
              where: {
                activo: true,
                OR: [
                  {
                    razonSocial: { contains: searchTerm, mode: "insensitive" },
                  },
                  {
                    nombreComercial: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                ],
              },
              select: { id: true, razonSocial: true, tipo: true, estado: true },
              take: limit,
              orderBy: { razonSocial: "asc" },
            })
            .then((items) => {
              results.certifiers = items.map((i) => ({
                id: i.id,
                name: i.razonSocial,
                type: i.tipo,
                estado: i.estado,
              }));
            }),
        );
      }

      if (type === "all" || type === "center") {
        searchPromises.push(
          prisma.renecCenter
            .findMany({
              where: {
                activo: true,
                nombre: { contains: searchTerm, mode: "insensitive" },
              },
              select: { id: true, nombre: true, estado: true, municipio: true },
              take: limit,
              orderBy: { nombre: "asc" },
            })
            .then((items) => {
              results.centers = items.map((i) => ({
                id: i.id,
                name: i.nombre,
                estado: i.estado,
                municipio: i.municipio,
              }));
            }),
        );
      }

      await Promise.all(searchPromises);

      return c.json(results);
    },
  );

  // ============================================
  // EC Standards - Enhanced
  // ============================================

  /**
   * GET /renec/ec
   * List EC standards with advanced filtering, search, and sorting
   */
  router.get("/ec", zValidator("query", ecSearchSchema), async (c) => {
    const {
      page,
      limit,
      q,
      vigente,
      sector,
      nivelCompetencia,
      sortBy,
      sortOrder,
      hasCertifiers,
      hasCenters,
    } = c.req.valid("query");
    const skip = (page - 1) * limit;

    const where: Prisma.RenecECWhereInput = {};

    // Vigente filter
    if (vigente !== "all") {
      where.vigente = vigente === "true";
    }

    // Sector filter
    if (sector) {
      where.sector = { contains: sector, mode: "insensitive" };
    }

    // Nivel de competencia filter
    if (nivelCompetencia) {
      where.nivelCompetencia = nivelCompetencia;
    }

    // Full-text search
    if (q) {
      where.OR = [
        { ecClave: { contains: q, mode: "insensitive" } },
        { titulo: { contains: q, mode: "insensitive" } },
        { proposito: { contains: q, mode: "insensitive" } },
      ];
    }

    // Has certifiers filter
    if (hasCertifiers === "true") {
      where.accreditations = { some: {} };
    } else if (hasCertifiers === "false") {
      where.accreditations = { none: {} };
    }

    // Has centers filter
    if (hasCenters === "true") {
      where.centerOfferings = { some: {} };
    } else if (hasCenters === "false") {
      where.centerOfferings = { none: {} };
    }

    const [items, total] = await Promise.all([
      prisma.renecEC.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          ecClave: true,
          titulo: true,
          version: true,
          vigente: true,
          sector: true,
          nivelCompetencia: true,
          fechaPublicacion: true,
          proposito: true,
          lastSyncedAt: true,
          _count: {
            select: {
              accreditations: true,
              centerOfferings: true,
            },
          },
        },
      }),
      prisma.renecEC.count({ where }),
    ]);

    return c.json({
      items: items.map((item) => ({
        ...item,
        certifierCount: item._count.accreditations,
        centerCount: item._count.centerOfferings,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        q,
        vigente,
        sector,
        nivelCompetencia,
      },
    });
  });

  /**
   * GET /renec/ec/:id
   * Get single EC standard with full details and related entities
   */
  router.get("/ec/:id", async (c) => {
    const id = c.req.param("id");

    const ec = await prisma.renecEC.findUnique({
      where: { id },
      include: {
        accreditations: {
          where: { vigente: true },
          include: {
            certifier: {
              select: {
                id: true,
                certId: true,
                razonSocial: true,
                tipo: true,
                activo: true,
                estado: true,
                telefono: true,
                email: true,
              },
            },
          },
        },
        centerOfferings: {
          where: { activo: true },
          include: {
            center: {
              select: {
                id: true,
                centerId: true,
                nombre: true,
                activo: true,
                estado: true,
                municipio: true,
                direccion: true,
                telefono: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ec) {
      return c.json({ error: "EC not found" }, 404);
    }

    // Transform to cleaner structure
    return c.json({
      ...ec,
      certifiers: ec.accreditations.map((a) => a.certifier),
      centers: ec.centerOfferings.map((o) => o.center),
      accreditations: undefined,
      centerOfferings: undefined,
    });
  });

  /**
   * GET /renec/ec/code/:code
   * Get EC by code (e.g., EC0217.01) - convenience endpoint
   */
  router.get("/ec/code/:code", async (c) => {
    const code = c.req.param("code").toUpperCase();

    const ec = await prisma.renecEC.findUnique({
      where: { ecClave: code },
      include: {
        accreditations: {
          where: { vigente: true },
          select: {
            certifier: { select: { id: true, razonSocial: true, tipo: true } },
          },
        },
        centerOfferings: {
          where: { activo: true },
          select: {
            center: { select: { id: true, nombre: true, estado: true } },
          },
        },
      },
    });

    if (!ec) {
      return c.json({ error: "EC not found" }, 404);
    }

    return c.json({
      ...ec,
      certifiers: ec.accreditations.map((a) => a.certifier),
      centers: ec.centerOfferings.map((o) => o.center),
      accreditations: undefined,
      centerOfferings: undefined,
    });
  });

  /**
   * GET /renec/ec/sectors
   * Get list of all sectors with counts
   */
  router.get("/ec/sectors", async (c) => {
    const sectors = await prisma.renecEC.groupBy({
      by: ["sector"],
      _count: { id: true },
      where: { sector: { not: null } },
      orderBy: { sector: "asc" },
    });

    return c.json(
      sectors.map((s) => ({
        sector: s.sector,
        count: s._count.id,
      })),
    );
  });

  // ============================================
  // Certifiers - Enhanced
  // ============================================

  /**
   * GET /renec/certifiers
   * List certifiers with advanced filtering
   */
  router.get(
    "/certifiers",
    zValidator("query", certifierSearchSchema),
    async (c) => {
      const {
        page,
        limit,
        q,
        tipo,
        activo,
        estado,
        estadoInegi,
        ecCode,
        sortBy,
        sortOrder,
      } = c.req.valid("query");
      const skip = (page - 1) * limit;

      const where: Prisma.RenecCertifierWhereInput = {};

      // Type filter
      if (tipo !== "all") {
        where.tipo = tipo;
      }

      // Active filter
      if (activo !== "all") {
        where.activo = activo === "true";
      }

      // Estado filter
      if (estado) {
        where.estado = { contains: estado, mode: "insensitive" };
      }
      if (estadoInegi) {
        where.estadoInegi = estadoInegi;
      }

      // Full-text search
      if (q) {
        where.OR = [
          { razonSocial: { contains: q, mode: "insensitive" } },
          { nombreComercial: { contains: q, mode: "insensitive" } },
          { rfc: { contains: q, mode: "insensitive" } },
        ];
      }

      // EC code filter - find certifiers accredited for specific EC
      if (ecCode) {
        where.accreditations = {
          some: {
            vigente: true,
            ec: {
              ecClave: { equals: ecCode.toUpperCase(), mode: "insensitive" },
            },
          },
        };
      }

      const [items, total] = await Promise.all([
        prisma.renecCertifier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            certId: true,
            tipo: true,
            razonSocial: true,
            nombreComercial: true,
            activo: true,
            estado: true,
            estadoInegi: true,
            telefono: true,
            email: true,
            sitioWeb: true,
            lastSyncedAt: true,
            _count: {
              select: {
                accreditations: true,
                centers: true,
              },
            },
          },
        }),
        prisma.renecCertifier.count({ where }),
      ]);

      return c.json({
        items: items.map((item) => ({
          ...item,
          ecCount: item._count.accreditations,
          centerCount: item._count.centers,
          _count: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    },
  );

  /**
   * GET /renec/certifiers/:id
   * Get single certifier with full details
   */
  router.get("/certifiers/:id", async (c) => {
    const id = c.req.param("id");

    const certifier = await prisma.renecCertifier.findUnique({
      where: { id },
      include: {
        accreditations: {
          where: { vigente: true },
          include: {
            ec: {
              select: {
                id: true,
                ecClave: true,
                titulo: true,
                vigente: true,
                sector: true,
              },
            },
          },
          orderBy: { ec: { ecClave: "asc" } },
        },
        centers: {
          where: { activo: true },
          select: {
            id: true,
            centerId: true,
            nombre: true,
            estado: true,
            municipio: true,
            activo: true,
            _count: { select: { offerings: true } },
          },
          orderBy: { nombre: "asc" },
        },
      },
    });

    if (!certifier) {
      return c.json({ error: "Certifier not found" }, 404);
    }

    return c.json({
      ...certifier,
      ecStandards: certifier.accreditations.map((a) => a.ec),
      accreditations: undefined,
    });
  });

  // ============================================
  // Centers - Enhanced
  // ============================================

  /**
   * GET /renec/centers
   * List evaluation centers with advanced filtering
   */
  router.get("/centers", zValidator("query", centerSearchSchema), async (c) => {
    const {
      page,
      limit,
      q,
      activo,
      estado,
      estadoInegi,
      municipio,
      certifierId,
      ecCode,
      sortBy,
      sortOrder,
    } = c.req.valid("query");
    const skip = (page - 1) * limit;

    const where: Prisma.RenecCenterWhereInput = {};

    // Active filter
    if (activo !== "all") {
      where.activo = activo === "true";
    }

    // Location filters
    if (estado) {
      where.estado = { contains: estado, mode: "insensitive" };
    }
    if (estadoInegi) {
      where.estadoInegi = estadoInegi;
    }
    if (municipio) {
      where.municipio = { contains: municipio, mode: "insensitive" };
    }

    // Certifier filter
    if (certifierId) {
      where.certifierId = certifierId;
    }

    // Full-text search
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { direccion: { contains: q, mode: "insensitive" } },
      ];
    }

    // EC code filter - find centers that offer specific EC
    if (ecCode) {
      where.offerings = {
        some: {
          activo: true,
          ec: {
            ecClave: { equals: ecCode.toUpperCase(), mode: "insensitive" },
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.renecCenter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          centerId: true,
          nombre: true,
          activo: true,
          estado: true,
          estadoInegi: true,
          municipio: true,
          direccion: true,
          telefono: true,
          email: true,
          lastSyncedAt: true,
          certifier: {
            select: {
              id: true,
              razonSocial: true,
              tipo: true,
            },
          },
          _count: {
            select: {
              offerings: true,
            },
          },
        },
      }),
      prisma.renecCenter.count({ where }),
    ]);

    return c.json({
      items: items.map((item) => ({
        ...item,
        ecCount: item._count.offerings,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  });

  /**
   * GET /renec/centers/:id
   * Get single center with full details
   */
  router.get("/centers/:id", async (c) => {
    const id = c.req.param("id");

    const center = await prisma.renecCenter.findUnique({
      where: { id },
      include: {
        certifier: {
          select: {
            id: true,
            certId: true,
            razonSocial: true,
            tipo: true,
            activo: true,
            telefono: true,
            email: true,
            sitioWeb: true,
          },
        },
        offerings: {
          where: { activo: true },
          include: {
            ec: {
              select: {
                id: true,
                ecClave: true,
                titulo: true,
                vigente: true,
                sector: true,
                nivelCompetencia: true,
              },
            },
          },
          orderBy: { ec: { ecClave: "asc" } },
        },
      },
    });

    if (!center) {
      return c.json({ error: "Center not found" }, 404);
    }

    return c.json({
      ...center,
      ecStandards: center.offerings.map((o) => o.ec),
      offerings: undefined,
    });
  });

  /**
   * GET /renec/centers/by-state/:estado
   * Get centers grouped by municipio for a specific state
   */
  router.get("/centers/by-state/:estado", async (c) => {
    const estado = c.req.param("estado");

    const centers = await prisma.renecCenter.findMany({
      where: {
        activo: true,
        estado: { contains: estado, mode: "insensitive" },
      },
      select: {
        id: true,
        nombre: true,
        municipio: true,
        direccion: true,
        telefono: true,
        latitud: true,
        longitud: true,
        _count: { select: { offerings: true } },
      },
      orderBy: [{ municipio: "asc" }, { nombre: "asc" }],
    });

    // Group by municipio
    const byMunicipio = centers.reduce(
      (acc, center) => {
        const mun = center.municipio || "Sin municipio";
        if (!acc[mun]) acc[mun] = [];
        acc[mun].push({
          ...center,
          ecCount: center._count.offerings,
          _count: undefined,
        });
        return acc;
      },
      {} as Record<string, typeof centers>,
    );

    return c.json({
      estado,
      total: centers.length,
      byMunicipio,
    });
  });

  /**
   * GET /renec/centers/nearby
   * Find centers near a specific location (for map integration)
   * Uses Haversine formula for accurate distance calculation
   */
  router.get(
    "/centers/nearby",
    zValidator("query", geoSearchSchema),
    async (c) => {
      const { lat, lng, radiusKm, limit, ecCode, activo } =
        c.req.valid("query");

      // Get bounding box for initial filtering (performance optimization)
      const bbox = getBoundingBox(lat, lng, radiusKm);

      const where: Prisma.RenecCenterWhereInput = {
        // Only include centers with coordinates
        latitud: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
        longitud: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
      };

      // Active filter
      if (activo !== "all") {
        where.activo = activo === "true";
      }

      // EC filter
      if (ecCode) {
        where.offerings = {
          some: {
            activo: true,
            ec: {
              ecClave: { equals: ecCode.toUpperCase(), mode: "insensitive" },
            },
          },
        };
      }

      // Fetch candidates within bounding box
      const candidates = await prisma.renecCenter.findMany({
        where,
        select: {
          id: true,
          centerId: true,
          nombre: true,
          activo: true,
          estado: true,
          municipio: true,
          direccion: true,
          telefono: true,
          email: true,
          latitud: true,
          longitud: true,
          certifier: {
            select: { id: true, razonSocial: true, tipo: true },
          },
          _count: { select: { offerings: true } },
        },
      });

      // Calculate actual distance and filter by radius
      const centersWithDistance = candidates
        .map((center) => ({
          ...center,
          ecCount: center._count.offerings,
          _count: undefined,
          distance: calculateDistance(
            lat,
            lng,
            center.latitud!,
            center.longitud!,
          ),
        }))
        .filter((center) => center.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return c.json({
        origin: { lat, lng },
        radiusKm,
        total: centersWithDistance.length,
        centers: centersWithDistance.map((c) => ({
          ...c,
          distance: Math.round(c.distance * 10) / 10, // Round to 1 decimal
        })),
      });
    },
  );

  /**
   * GET /renec/centers/map-bounds
   * Get centers within map viewport bounds (for efficient map rendering)
   */
  router.get(
    "/centers/map-bounds",
    zValidator(
      "query",
      z.object({
        north: z.coerce.number().min(-90).max(90),
        south: z.coerce.number().min(-90).max(90),
        east: z.coerce.number().min(-180).max(180),
        west: z.coerce.number().min(-180).max(180),
        ecCode: z.string().optional(),
        activo: z.enum(["true", "false", "all"]).default("true"),
        limit: z.coerce.number().min(1).max(500).default(200),
      }),
    ),
    async (c) => {
      const { north, south, east, west, ecCode, activo, limit } =
        c.req.valid("query");

      const where: Prisma.RenecCenterWhereInput = {
        latitud: { not: null, gte: south, lte: north },
        longitud: { not: null, gte: west, lte: east },
      };

      if (activo !== "all") {
        where.activo = activo === "true";
      }

      if (ecCode) {
        where.offerings = {
          some: {
            activo: true,
            ec: {
              ecClave: { equals: ecCode.toUpperCase(), mode: "insensitive" },
            },
          },
        };
      }

      const centers = await prisma.renecCenter.findMany({
        where,
        take: limit,
        select: {
          id: true,
          nombre: true,
          latitud: true,
          longitud: true,
          estado: true,
          municipio: true,
          activo: true,
          _count: { select: { offerings: true } },
        },
      });

      return c.json({
        bounds: { north, south, east, west },
        total: centers.length,
        centers: centers.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          lat: c.latitud,
          lng: c.longitud,
          estado: c.estado,
          municipio: c.municipio,
          activo: c.activo,
          ecCount: c._count.offerings,
        })),
      });
    },
  );

  // ============================================
  // Mexican States Reference
  // ============================================

  /**
   * GET /renec/estados
   * Get list of Mexican states with INEGI codes and counts
   */
  router.get("/estados", async (c) => {
    const [certifierCounts, centerCounts] = await Promise.all([
      prisma.renecCertifier.groupBy({
        by: ["estado", "estadoInegi"],
        _count: { id: true },
        where: { activo: true, estado: { not: null } },
      }),
      prisma.renecCenter.groupBy({
        by: ["estado", "estadoInegi"],
        _count: { id: true },
        where: { activo: true, estado: { not: null } },
      }),
    ]);

    // Merge counts
    const stateMap = new Map<
      string,
      {
        estado: string;
        inegi: string | null;
        certifiers: number;
        centers: number;
      }
    >();

    for (const c of certifierCounts) {
      if (c.estado) {
        stateMap.set(c.estado, {
          estado: c.estado,
          inegi: c.estadoInegi,
          certifiers: c._count.id,
          centers: 0,
        });
      }
    }

    for (const c of centerCounts) {
      if (c.estado) {
        const existing = stateMap.get(c.estado);
        if (existing) {
          existing.centers = c._count.id;
        } else {
          stateMap.set(c.estado, {
            estado: c.estado,
            inegi: c.estadoInegi,
            certifiers: 0,
            centers: c._count.id,
          });
        }
      }
    }

    const estados = Array.from(stateMap.values()).sort((a, b) =>
      a.estado.localeCompare(b.estado),
    );

    return c.json(estados);
  });

  // ============================================
  // Sync Operations (Admin Only)
  // ============================================

  /**
   * POST /renec/sync/ec
   * Trigger EC standards sync
   */
  router.post("/sync/ec", async (c) => {
    // TODO: Add admin auth middleware
    const result = await syncService.syncECStandards();
    return c.json(result);
  });

  /**
   * POST /renec/sync/certifiers
   * Trigger certifiers sync
   */
  router.post("/sync/certifiers", async (c) => {
    const result = await syncService.syncCertifiers();
    return c.json(result);
  });

  /**
   * POST /renec/sync/centers
   * Trigger centers sync
   */
  router.post("/sync/centers", async (c) => {
    const result = await syncService.syncCenters();
    return c.json(result);
  });

  /**
   * POST /renec/sync/all
   * Trigger full sync
   */
  router.post("/sync/all", async (c) => {
    const results = await syncService.syncAll();
    return c.json(results);
  });

  /**
   * GET /renec/sync/jobs
   * Get recent sync jobs
   */
  router.get("/sync/jobs", async (c) => {
    const jobs = await syncService.getRecentJobs(20);
    return c.json(jobs);
  });

  /**
   * GET /renec/sync/status
   * Get current sync status and data freshness
   */
  router.get("/sync/status", async (c) => {
    const [stats, lastJobs] = await Promise.all([
      syncService.getSyncStats(),
      prisma.renecSyncJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          jobType: true,
          status: true,
          itemsProcessed: true,
          itemsCreated: true,
          itemsUpdated: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    return c.json({
      ...stats,
      recentJobs: lastJobs,
    });
  });

  // ============================================
  // Scheduler Operations (Admin Only)
  // ============================================

  /**
   * GET /renec/scheduler/status
   * Get scheduler status and all task schedules
   */
  router.get("/scheduler/status", async (c) => {
    if (!schedulerInstance) {
      return c.json({ error: "Scheduler not initialized" }, 500);
    }

    return c.json({
      tasks: schedulerInstance.getStatus(),
    });
  });

  /**
   * POST /renec/scheduler/start
   * Start the scheduler
   */
  router.post("/scheduler/start", async (c) => {
    if (!schedulerInstance) {
      return c.json({ error: "Scheduler not initialized" }, 500);
    }

    schedulerInstance.start();
    return c.json({
      message: "Scheduler started",
      tasks: schedulerInstance.getStatus(),
    });
  });

  /**
   * POST /renec/scheduler/stop
   * Stop the scheduler
   */
  router.post("/scheduler/stop", async (c) => {
    if (!schedulerInstance) {
      return c.json({ error: "Scheduler not initialized" }, 500);
    }

    schedulerInstance.stop();
    return c.json({ message: "Scheduler stopped" });
  });

  /**
   * POST /renec/scheduler/run/:task
   * Manually run a specific task
   */
  router.post("/scheduler/run/:task", async (c) => {
    if (!schedulerInstance) {
      return c.json({ error: "Scheduler not initialized" }, 500);
    }

    const taskName = c.req.param("task");

    try {
      await schedulerInstance.runTask(taskName);
      return c.json({ message: `Task ${taskName} completed` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: message }, 400);
    }
  });

  /**
   * PUT /renec/scheduler/task/:task
   * Update task settings (enable/disable, change schedule)
   */
  router.put(
    "/scheduler/task/:task",
    zValidator(
      "json",
      z.object({
        enabled: z.boolean().optional(),
        schedule: z.string().optional(),
      }),
    ),
    async (c) => {
      if (!schedulerInstance) {
        return c.json({ error: "Scheduler not initialized" }, 500);
      }

      const taskName = c.req.param("task");
      const { enabled, schedule } = c.req.valid("json");

      try {
        if (enabled !== undefined) {
          schedulerInstance.setTaskEnabled(taskName, enabled);
        }
        if (schedule !== undefined) {
          schedulerInstance.setTaskSchedule(taskName, schedule);
        }
        return c.json({
          message: `Task ${taskName} updated`,
          tasks: schedulerInstance.getStatus(),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return c.json({ error: message }, 400);
      }
    },
  );

  return router;
}

// Export scheduler instance for external access
export function getScheduler(): SchedulerService | null {
  return schedulerInstance;
}

// Export function to start scheduler (for app bootstrap)
export function startScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.start();
  }
}

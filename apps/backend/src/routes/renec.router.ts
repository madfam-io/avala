/**
 * RENEC API Router
 *
 * Endpoints for RENEC data access and sync operations.
 * Admin-only endpoints for triggering syncs.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { PrismaClient } from '@prisma/client';
import { RenecSyncService } from '../services/renec/sync.service';

// Query schemas
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const ecFilterSchema = paginationSchema.extend({
  vigente: z.enum(['true', 'false']).optional(),
  sector: z.string().optional(),
  search: z.string().optional(),
});

const certifierFilterSchema = paginationSchema.extend({
  tipo: z.enum(['ECE', 'OC']).optional(),
  activo: z.enum(['true', 'false']).optional(),
  estado: z.string().optional(),
  search: z.string().optional(),
});

const centerFilterSchema = paginationSchema.extend({
  activo: z.enum(['true', 'false']).optional(),
  estado: z.string().optional(),
  certifierId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export function createRenecRouter(prisma: PrismaClient) {
  const router = new Hono();
  const syncService = new RenecSyncService(prisma);

  // ========================
  // EC Standards
  // ========================

  /**
   * GET /renec/ec
   * List EC standards with filtering and pagination
   */
  router.get('/ec', zValidator('query', ecFilterSchema), async (c) => {
    const { page, limit, vigente, sector, search } = c.req.valid('query');
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.renecEC.findMany>[0]['where'] = {};

    if (vigente !== undefined) {
      where.vigente = vigente === 'true';
    }
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { ecClave: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.renecEC.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ecClave: 'asc' },
        select: {
          id: true,
          ecClave: true,
          titulo: true,
          version: true,
          vigente: true,
          sector: true,
          nivelCompetencia: true,
          lastSyncedAt: true,
        },
      }),
      prisma.renecEC.count({ where }),
    ]);

    return c.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * GET /renec/ec/:id
   * Get single EC standard with full details
   */
  router.get('/ec/:id', async (c) => {
    const id = c.req.param('id');

    const ec = await prisma.renecEC.findUnique({
      where: { id },
      include: {
        accreditations: {
          include: {
            certifier: {
              select: {
                id: true,
                certId: true,
                razonSocial: true,
                tipo: true,
              },
            },
          },
        },
        centerOfferings: {
          include: {
            center: {
              select: {
                id: true,
                centerId: true,
                nombre: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!ec) {
      return c.json({ error: 'EC not found' }, 404);
    }

    return c.json(ec);
  });

  /**
   * GET /renec/ec/code/:code
   * Get EC by code (e.g., EC0217.01)
   */
  router.get('/ec/code/:code', async (c) => {
    const code = c.req.param('code');

    const ec = await prisma.renecEC.findUnique({
      where: { ecClave: code },
    });

    if (!ec) {
      return c.json({ error: 'EC not found' }, 404);
    }

    return c.json(ec);
  });

  // ========================
  // Certifiers
  // ========================

  /**
   * GET /renec/certifiers
   * List certifiers (ECE/OC) with filtering
   */
  router.get('/certifiers', zValidator('query', certifierFilterSchema), async (c) => {
    const { page, limit, tipo, activo, estado, search } = c.req.valid('query');
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.renecCertifier.findMany>[0]['where'] = {};

    if (tipo) {
      where.tipo = tipo;
    }
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }
    if (estado) {
      where.estado = { contains: estado, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { nombreComercial: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.renecCertifier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razonSocial: 'asc' },
        select: {
          id: true,
          certId: true,
          tipo: true,
          razonSocial: true,
          nombreComercial: true,
          activo: true,
          estado: true,
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
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * GET /renec/certifiers/:id
   * Get single certifier with details
   */
  router.get('/certifiers/:id', async (c) => {
    const id = c.req.param('id');

    const certifier = await prisma.renecCertifier.findUnique({
      where: { id },
      include: {
        accreditations: {
          include: {
            ec: {
              select: {
                id: true,
                ecClave: true,
                titulo: true,
                vigente: true,
              },
            },
          },
        },
        centers: {
          select: {
            id: true,
            centerId: true,
            nombre: true,
            estado: true,
            activo: true,
          },
        },
      },
    });

    if (!certifier) {
      return c.json({ error: 'Certifier not found' }, 404);
    }

    return c.json(certifier);
  });

  // ========================
  // Centers
  // ========================

  /**
   * GET /renec/centers
   * List evaluation centers with filtering
   */
  router.get('/centers', zValidator('query', centerFilterSchema), async (c) => {
    const { page, limit, activo, estado, certifierId, search } = c.req.valid('query');
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.renecCenter.findMany>[0]['where'] = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }
    if (estado) {
      where.estado = { contains: estado, mode: 'insensitive' };
    }
    if (certifierId) {
      where.certifierId = certifierId;
    }
    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.renecCenter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          centerId: true,
          nombre: true,
          activo: true,
          estado: true,
          municipio: true,
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
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * GET /renec/centers/:id
   * Get single center with details
   */
  router.get('/centers/:id', async (c) => {
    const id = c.req.param('id');

    const center = await prisma.renecCenter.findUnique({
      where: { id },
      include: {
        certifier: true,
        offerings: {
          include: {
            ec: {
              select: {
                id: true,
                ecClave: true,
                titulo: true,
                vigente: true,
              },
            },
          },
        },
      },
    });

    if (!center) {
      return c.json({ error: 'Center not found' }, 404);
    }

    return c.json(center);
  });

  // ========================
  // Sync Operations (Admin)
  // ========================

  /**
   * POST /renec/sync/ec
   * Trigger EC standards sync (admin only)
   */
  router.post('/sync/ec', async (c) => {
    // TODO: Add admin auth middleware
    const result = await syncService.syncECStandards();
    return c.json(result);
  });

  /**
   * POST /renec/sync/certifiers
   * Trigger certifiers sync (admin only)
   */
  router.post('/sync/certifiers', async (c) => {
    const result = await syncService.syncCertifiers();
    return c.json(result);
  });

  /**
   * POST /renec/sync/centers
   * Trigger centers sync (admin only)
   */
  router.post('/sync/centers', async (c) => {
    const result = await syncService.syncCenters();
    return c.json(result);
  });

  /**
   * POST /renec/sync/all
   * Trigger full sync (admin only)
   */
  router.post('/sync/all', async (c) => {
    const results = await syncService.syncAll();
    return c.json(results);
  });

  /**
   * GET /renec/sync/jobs
   * Get recent sync jobs
   */
  router.get('/sync/jobs', async (c) => {
    const jobs = await syncService.getRecentJobs();
    return c.json(jobs);
  });

  /**
   * GET /renec/sync/stats
   * Get sync statistics
   */
  router.get('/sync/stats', async (c) => {
    const stats = await syncService.getSyncStats();
    return c.json(stats);
  });

  return router;
}

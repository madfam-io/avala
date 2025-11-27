/**
 * RENEC Sync Service
 *
 * Orchestrates harvesting from RENEC (CONOCER) and syncing to database.
 * Uses @avala/renec-client drivers for extraction.
 */

import { PrismaClient, RenecSyncJobType, RenecSyncStatus } from '@prisma/client';
import {
  ECDriver,
  CertifierDriver,
  CenterDriver,
  computeContentHash,
  type ECStandard,
  type Certifier,
  type EvaluationCenter,
  type DriverConfig,
  type ExtractedItem,
} from '@avala/renec-client';

export interface SyncResult {
  jobId: string;
  jobType: RenecSyncJobType;
  status: RenecSyncStatus;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
  duration: number;
}

export class RenecSyncService {
  constructor(
    private prisma: PrismaClient,
    private driverConfig?: DriverConfig
  ) {}

  /**
   * Sync EC Standards from RENEC
   */
  async syncECStandards(): Promise<SyncResult> {
    const job = await this.createJob(RenecSyncJobType.EC_STANDARDS);
    const startTime = Date.now();
    const errors: string[] = [];

    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    try {
      await this.updateJobStatus(job.id, RenecSyncStatus.RUNNING);

      const driver = new ECDriver(this.driverConfig);
      const items = await driver.harvest();

      for (const item of items) {
        itemsProcessed++;
        try {
          const ec = item.data as ECStandard;
          const contentHash = computeContentHash(ec as unknown as Record<string, unknown>);

          const existing = await this.prisma.renecEC.findUnique({
            where: { ecClave: ec.ecClave },
          });

          if (existing) {
            // Check if content changed
            if (existing.contentHash === contentHash) {
              itemsSkipped++;
              continue;
            }

            // Update existing
            await this.prisma.renecEC.update({
              where: { id: existing.id },
              data: {
                titulo: ec.titulo,
                version: ec.version,
                vigente: ec.vigente,
                fechaPublicacion: ec.fechaPublicacion ? new Date(ec.fechaPublicacion) : null,
                fechaFinVigencia: ec.fechaFinVigencia ? new Date(ec.fechaFinVigencia) : null,
                sector: ec.sector,
                nivelCompetencia: ec.nivelCompetencia,
                proposito: ec.proposito,
                competencias: ec.competencias || [],
                elementosJson: ec.elementos || [],
                critDesempeno: ec.criteriosDesempeno || [],
                critConocimiento: ec.criteriosConocimiento || [],
                critProducto: ec.criteriosProducto || [],
                sourceUrl: item.url,
                contentHash,
                lastSyncedAt: new Date(),
              },
            });
            itemsUpdated++;
          } else {
            // Create new
            await this.prisma.renecEC.create({
              data: {
                ecClave: ec.ecClave,
                titulo: ec.titulo,
                version: ec.version,
                vigente: ec.vigente,
                fechaPublicacion: ec.fechaPublicacion ? new Date(ec.fechaPublicacion) : null,
                fechaFinVigencia: ec.fechaFinVigencia ? new Date(ec.fechaFinVigencia) : null,
                sector: ec.sector,
                nivelCompetencia: ec.nivelCompetencia,
                proposito: ec.proposito,
                competencias: ec.competencias || [],
                elementosJson: ec.elementos || [],
                critDesempeno: ec.criteriosDesempeno || [],
                critConocimiento: ec.criteriosConocimiento || [],
                critProducto: ec.criteriosProducto || [],
                sourceUrl: item.url,
                contentHash,
              },
            });
            itemsCreated++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`EC ${(item.data as ECStandard).ecClave}: ${msg}`);
        }
      }

      await this.completeJob(job.id, {
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        itemsSkipped,
        errors,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Sync failed: ${msg}`);
      await this.failJob(job.id, errors);
    }

    return {
      jobId: job.id,
      jobType: RenecSyncJobType.EC_STANDARDS,
      status: errors.length > 0 && itemsProcessed === 0 ? RenecSyncStatus.FAILED : RenecSyncStatus.COMPLETED,
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsSkipped,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Certifiers (ECE/OC) from RENEC
   */
  async syncCertifiers(): Promise<SyncResult> {
    const job = await this.createJob(RenecSyncJobType.CERTIFIERS);
    const startTime = Date.now();
    const errors: string[] = [];

    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    try {
      await this.updateJobStatus(job.id, RenecSyncStatus.RUNNING);

      const driver = new CertifierDriver(this.driverConfig);
      const items = await driver.harvest();

      for (const item of items) {
        itemsProcessed++;
        try {
          const cert = item.data as Certifier;
          const contentHash = computeContentHash(cert as unknown as Record<string, unknown>);

          const existing = await this.prisma.renecCertifier.findUnique({
            where: { certId: cert.certId },
          });

          if (existing) {
            if (existing.contentHash === contentHash) {
              itemsSkipped++;
              continue;
            }

            await this.prisma.renecCertifier.update({
              where: { id: existing.id },
              data: {
                tipo: cert.tipo === 'OC' ? 'OC' : 'ECE',
                razonSocial: cert.razonSocial,
                nombreComercial: cert.nombreComercial,
                activo: cert.activo,
                direccion: cert.direccion,
                telefono: cert.telefono,
                email: cert.email,
                sitioWeb: cert.sitioWeb,
                rfc: cert.rfc,
                representanteLegal: cert.representanteLegal,
                estado: cert.estado,
                estadoInegi: cert.estadoInegi,
                municipio: cert.municipio,
                sourceUrl: item.url,
                contentHash,
                lastSyncedAt: new Date(),
              },
            });
            itemsUpdated++;

            // Sync accreditations
            await this.syncAccreditations(existing.id, cert.estandaresAcreditados || []);
          } else {
            const created = await this.prisma.renecCertifier.create({
              data: {
                certId: cert.certId,
                tipo: cert.tipo === 'OC' ? 'OC' : 'ECE',
                razonSocial: cert.razonSocial,
                nombreComercial: cert.nombreComercial,
                activo: cert.activo,
                direccion: cert.direccion,
                telefono: cert.telefono,
                email: cert.email,
                sitioWeb: cert.sitioWeb,
                rfc: cert.rfc,
                representanteLegal: cert.representanteLegal,
                estado: cert.estado,
                estadoInegi: cert.estadoInegi,
                municipio: cert.municipio,
                sourceUrl: item.url,
                contentHash,
              },
            });
            itemsCreated++;

            // Sync accreditations
            await this.syncAccreditations(created.id, cert.estandaresAcreditados || []);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Certifier ${(item.data as Certifier).certId}: ${msg}`);
        }
      }

      await this.completeJob(job.id, {
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        itemsSkipped,
        errors,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Sync failed: ${msg}`);
      await this.failJob(job.id, errors);
    }

    return {
      jobId: job.id,
      jobType: RenecSyncJobType.CERTIFIERS,
      status: errors.length > 0 && itemsProcessed === 0 ? RenecSyncStatus.FAILED : RenecSyncStatus.COMPLETED,
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsSkipped,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Evaluation Centers from RENEC
   */
  async syncCenters(): Promise<SyncResult> {
    const job = await this.createJob(RenecSyncJobType.CENTERS);
    const startTime = Date.now();
    const errors: string[] = [];

    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    try {
      await this.updateJobStatus(job.id, RenecSyncStatus.RUNNING);

      const driver = new CenterDriver(this.driverConfig);
      const items = await driver.harvest();

      for (const item of items) {
        itemsProcessed++;
        try {
          const center = item.data as EvaluationCenter;
          const contentHash = computeContentHash(center as unknown as Record<string, unknown>);

          // Find parent certifier if specified
          let certifierId: string | null = null;
          if (center.certId) {
            const certifier = await this.prisma.renecCertifier.findUnique({
              where: { certId: center.certId },
            });
            certifierId = certifier?.id || null;
          }

          const existing = await this.prisma.renecCenter.findUnique({
            where: { centerId: center.centerId },
          });

          if (existing) {
            if (existing.contentHash === contentHash) {
              itemsSkipped++;
              continue;
            }

            await this.prisma.renecCenter.update({
              where: { id: existing.id },
              data: {
                certifierId,
                nombre: center.nombre,
                activo: center.activo,
                direccion: center.direccion,
                telefono: center.telefono,
                email: center.email,
                estado: center.estado,
                estadoInegi: center.estadoInegi,
                municipio: center.municipio,
                sourceUrl: item.url,
                contentHash,
                lastSyncedAt: new Date(),
              },
            });
            itemsUpdated++;

            // Sync offerings
            await this.syncCenterOfferings(existing.id, center.estandaresOfrecidos || []);
          } else {
            const created = await this.prisma.renecCenter.create({
              data: {
                centerId: center.centerId,
                certifierId,
                nombre: center.nombre,
                activo: center.activo,
                direccion: center.direccion,
                telefono: center.telefono,
                email: center.email,
                estado: center.estado,
                estadoInegi: center.estadoInegi,
                municipio: center.municipio,
                sourceUrl: item.url,
                contentHash,
              },
            });
            itemsCreated++;

            // Sync offerings
            await this.syncCenterOfferings(created.id, center.estandaresOfrecidos || []);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Center ${(item.data as EvaluationCenter).centerId}: ${msg}`);
        }
      }

      await this.completeJob(job.id, {
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        itemsSkipped,
        errors,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Sync failed: ${msg}`);
      await this.failJob(job.id, errors);
    }

    return {
      jobId: job.id,
      jobType: RenecSyncJobType.CENTERS,
      status: errors.length > 0 && itemsProcessed === 0 ? RenecSyncStatus.FAILED : RenecSyncStatus.COMPLETED,
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsSkipped,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Full sync of all RENEC data
   */
  async syncAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Sync in order: EC first (referenced by others), then certifiers, then centers
    results.push(await this.syncECStandards());
    results.push(await this.syncCertifiers());
    results.push(await this.syncCenters());

    return results;
  }

  /**
   * Get recent sync jobs
   */
  async getRecentJobs(limit = 10) {
    return this.prisma.renecSyncJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const [ecCount, certifierCount, centerCount, lastJob] = await Promise.all([
      this.prisma.renecEC.count(),
      this.prisma.renecCertifier.count(),
      this.prisma.renecCenter.count(),
      this.prisma.renecSyncJob.findFirst({
        where: { status: RenecSyncStatus.COMPLETED },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    return {
      ecStandards: ecCount,
      certifiers: certifierCount,
      centers: centerCount,
      lastSyncAt: lastJob?.completedAt || null,
    };
  }

  // Private helpers

  private async createJob(jobType: RenecSyncJobType) {
    return this.prisma.renecSyncJob.create({
      data: {
        jobType,
        status: RenecSyncStatus.PENDING,
      },
    });
  }

  private async updateJobStatus(jobId: string, status: RenecSyncStatus) {
    return this.prisma.renecSyncJob.update({
      where: { id: jobId },
      data: {
        status,
        startedAt: status === RenecSyncStatus.RUNNING ? new Date() : undefined,
      },
    });
  }

  private async completeJob(
    jobId: string,
    stats: {
      itemsProcessed: number;
      itemsCreated: number;
      itemsUpdated: number;
      itemsSkipped: number;
      errors: string[];
    }
  ) {
    return this.prisma.renecSyncJob.update({
      where: { id: jobId },
      data: {
        status: RenecSyncStatus.COMPLETED,
        completedAt: new Date(),
        ...stats,
      },
    });
  }

  private async failJob(jobId: string, errors: string[]) {
    return this.prisma.renecSyncJob.update({
      where: { id: jobId },
      data: {
        status: RenecSyncStatus.FAILED,
        completedAt: new Date(),
        errors,
      },
    });
  }

  private async syncAccreditations(certifierId: string, ecCodes: string[]) {
    // Remove old accreditations not in new list
    await this.prisma.renecAccreditation.deleteMany({
      where: {
        certifierId,
        ec: { ecClave: { notIn: ecCodes } },
      },
    });

    // Add new accreditations
    for (const ecCode of ecCodes) {
      const ec = await this.prisma.renecEC.findUnique({
        where: { ecClave: ecCode },
      });

      if (ec) {
        await this.prisma.renecAccreditation.upsert({
          where: {
            certifierId_ecId: { certifierId, ecId: ec.id },
          },
          create: {
            certifierId,
            ecId: ec.id,
            vigente: true,
          },
          update: {
            vigente: true,
          },
        });
      }
    }
  }

  private async syncCenterOfferings(centerId: string, ecCodes: string[]) {
    // Remove old offerings not in new list
    await this.prisma.renecCenterOffering.deleteMany({
      where: {
        centerId,
        ec: { ecClave: { notIn: ecCodes } },
      },
    });

    // Add new offerings
    for (const ecCode of ecCodes) {
      const ec = await this.prisma.renecEC.findUnique({
        where: { ecClave: ecCode },
      });

      if (ec) {
        await this.prisma.renecCenterOffering.upsert({
          where: {
            centerId_ecId: { centerId, ecId: ec.id },
          },
          create: {
            centerId,
            ecId: ec.id,
            activo: true,
          },
          update: {
            activo: true,
          },
        });
      }
    }
  }
}

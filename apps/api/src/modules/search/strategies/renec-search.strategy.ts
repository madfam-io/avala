import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class RenecCenterSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.RENEC_CENTRO;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    query: string,
    _tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const centers = await this.prisma.renecCenter.findMany({
      where: {
        OR: [
          { nombre: { contains: normalizedQuery, mode: 'insensitive' } },
          { direccion: { contains: normalizedQuery, mode: 'insensitive' } },
          { municipio: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    const results = centers.map((center) => ({
      id: center.id,
      entityType: this.entityType,
      title: center.nombre,
      description: `${center.municipio || ''}, ${center.estado || ''}`,
      score: this.calculateScore(normalizedQuery, [
        center.nombre,
        center.municipio || '',
      ]),
      metadata: {
        estado: center.estado,
        telefono: center.telefono,
      },
      url: `/renec/centers/${center.id}`,
      createdAt: center.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}

@Injectable()
export class RenecCertifierSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.RENEC_CERTIFICADOR;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    query: string,
    _tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const certifiers = await this.prisma.renecCertifier.findMany({
      where: {
        OR: [
          { razonSocial: { contains: normalizedQuery, mode: 'insensitive' } },
          { nombreComercial: { contains: normalizedQuery, mode: 'insensitive' } },
          { direccion: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    const results = certifiers.map((cert) => ({
      id: cert.id,
      entityType: this.entityType,
      title: cert.razonSocial,
      description: cert.nombreComercial || undefined,
      score: this.calculateScore(normalizedQuery, [
        cert.razonSocial,
        cert.nombreComercial || '',
      ]),
      metadata: {
        nombreComercial: cert.nombreComercial,
        tipo: cert.tipo,
        estado: cert.estado,
      },
      url: `/renec/certifiers/${cert.id}`,
      createdAt: cert.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}

@Injectable()
export class RenecECSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.RENEC_EC;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    query: string,
    _tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const ecs = await this.prisma.renecEC.findMany({
      where: {
        OR: [
          { ecClave: { contains: normalizedQuery, mode: 'insensitive' } },
          { titulo: { contains: normalizedQuery, mode: 'insensitive' } },
          { sector: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    const results = ecs.map((ec) => ({
      id: ec.id,
      entityType: this.entityType,
      title: `${ec.ecClave} - ${ec.titulo}`,
      description: ec.sector || undefined,
      score: this.calculateScore(normalizedQuery, [
        ec.ecClave,
        ec.titulo,
        ec.sector || '',
      ]),
      metadata: {
        sector: ec.sector,
        nivel: ec.nivelCompetencia,
        vigente: ec.vigente,
      },
      url: `/renec/ec/${ec.id}`,
      createdAt: ec.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}

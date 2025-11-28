import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  SimulationType,
  CreateScenarioDto,
  UpdateScenarioDto,
  ScenarioQueryDto,
} from "./dto/simulation.dto";

/**
 * Simulation Service
 * Manages simulation scenarios using ECSimulation model
 */
@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SCENARIO CRUD
  // ============================================

  async createScenario(dto: CreateScenarioDto) {
    const scenario = await this.prisma.eCSimulation.create({
      data: {
        ecId: dto.ecStandardId,
        code: dto.code || this.generateCode(dto.type),
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        type: dto.type as "INTERVIEW" | "PRESENTATION" | "ROLE_PLAY",
        scenario: (dto.scenario || {}) as object,
        rubric: (dto.rubric || []) as object[],
      },
      include: {
        ec: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    this.logger.log(`Created simulation scenario: ${scenario.id}`);
    return scenario;
  }

  async getScenario(id: string) {
    const scenario = await this.prisma.eCSimulation.findUnique({
      where: { id },
      include: {
        ec: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Simulation scenario ${id} not found`);
    }

    return scenario;
  }

  async getScenarios(query: ScenarioQueryDto) {
    const { ecStandardId, type, search, skip, limit } = query;

    const where: Record<string, unknown> = {};

    if (ecStandardId) where.ecId = ecStandardId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.eCSimulation.findMany({
        where,
        skip: skip || 0,
        take: limit || 20,
        include: {
          ec: {
            select: { id: true, code: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.eCSimulation.count({ where }),
    ]);

    return { data, total, skip: skip || 0, limit: limit || 20 };
  }

  async updateScenario(id: string, dto: UpdateScenarioDto) {
    const existing = await this.prisma.eCSimulation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Simulation scenario ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.titleEn !== undefined) updateData.titleEn = dto.titleEn;
    if (dto.description) updateData.description = dto.description;
    if (dto.type) updateData.type = dto.type;
    if (dto.scenario) updateData.scenario = dto.scenario;
    if (dto.rubric) updateData.rubric = dto.rubric;

    const updated = await this.prisma.eCSimulation.update({
      where: { id },
      data: updateData,
      include: {
        ec: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    this.logger.log(`Updated simulation scenario: ${id}`);
    return updated;
  }

  async deleteScenario(id: string) {
    const scenario = await this.prisma.eCSimulation.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundException(`Simulation scenario ${id} not found`);
    }

    await this.prisma.eCSimulation.delete({
      where: { id },
    });

    this.logger.log(`Deleted simulation scenario: ${id}`);
    return { success: true };
  }

  // ============================================
  // SCENARIO TEMPLATES
  // ============================================

  async getScenariosByEC(ecStandardId: string) {
    return this.prisma.eCSimulation.findMany({
      where: { ecId: ecStandardId },
      orderBy: { type: "asc" },
    });
  }

  async seedInterviewScenarios(ecStandardId: string) {
    const scenarios = [
      {
        ecId: ecStandardId,
        code: "ENT-001",
        title: "Entrevista con Director General",
        description:
          "Simulación de entrevista de consultoría con un Director General para identificar necesidades de capacitación.",
        type: "INTERVIEW" as const,
        scenario: {
          clientProfile: {
            name: "Lic. Roberto Mendoza",
            position: "Director General",
            company: "Manufacturera del Norte S.A.",
            industry: "Manufactura automotriz",
            employees: 450,
            challenges: [
              "Alta rotación de personal",
              "Necesidad de certificaciones",
              "Mejora de productividad",
            ],
          },
          dialogues: [
            {
              type: "greeting",
              clientText:
                "Buenos días, adelante, tome asiento. Tengo 30 minutos antes de mi siguiente junta.",
              expectedTopics: ["saludo", "presentación", "tiempo"],
            },
            {
              type: "needs_discovery",
              clientText:
                "Mire, tenemos problemas serios con la rotación. No entiendo por qué la gente se va.",
              expectedTopics: [
                "rotación",
                "causas",
                "entrevistas de salida",
                "clima laboral",
              ],
            },
            {
              type: "proposal",
              clientText: "¿Y cómo podría ayudarnos la capacitación con eso?",
              expectedTopics: ["desarrollo", "plan carrera", "retención"],
            },
          ],
          duration: 1800,
          passingScore: 70,
        },
        rubric: [
          {
            id: "intro",
            title: "Presentación profesional",
            weight: 15,
            indicators: ["nombre", "empresa", "propósito"],
          },
          {
            id: "discovery",
            title: "Descubrimiento de necesidades",
            weight: 30,
            indicators: ["preguntas abiertas", "escucha activa", "parafraseo"],
          },
          {
            id: "solution",
            title: "Propuesta de solución",
            weight: 25,
            indicators: ["alineación", "beneficios", "evidencia"],
          },
          {
            id: "closing",
            title: "Cierre efectivo",
            weight: 15,
            indicators: ["resumen", "siguientes pasos", "compromiso"],
          },
          {
            id: "communication",
            title: "Comunicación",
            weight: 15,
            indicators: ["claridad", "profesionalismo", "rapport"],
          },
        ],
      },
    ];

    const results = [];
    for (const scenarioData of scenarios) {
      try {
        const existing = await this.prisma.eCSimulation.findFirst({
          where: { ecId: ecStandardId, code: scenarioData.code },
        });

        if (!existing) {
          const created = await this.prisma.eCSimulation.create({
            data: scenarioData,
          });
          results.push(created);
        }
      } catch (error) {
        this.logger.error(`Error seeding scenario:`, error);
      }
    }

    return results;
  }

  async seedPresentationScenarios(ecStandardId: string) {
    const scenarios = [
      {
        ecId: ecStandardId,
        code: "PRES-001",
        title: "Presentación de Resultados a Comité Directivo",
        description:
          "Simulación de presentación de resultados de diagnóstico de capacitación ante el comité directivo.",
        type: "PRESENTATION" as const,
        scenario: {
          context: {
            audience: "Comité Directivo (6 personas)",
            duration: 1200,
            objective: "Presentar hallazgos del diagnóstico y plan de acción",
            resources: ["proyector", "pantalla", "pizarrón"],
          },
          structure: [
            { phase: "apertura", duration: 120, weight: 15 },
            { phase: "contexto", duration: 180, weight: 20 },
            { phase: "hallazgos", duration: 360, weight: 30 },
            { phase: "recomendaciones", duration: 300, weight: 25 },
            { phase: "cierre", duration: 240, weight: 10 },
          ],
          evaluationCriteria: [
            "Estructura clara",
            "Datos relevantes",
            "Visuales efectivos",
            "Manejo de preguntas",
            "Propuesta de valor",
          ],
          passingScore: 70,
        },
        rubric: [
          {
            id: "structure",
            title: "Estructura de presentación",
            weight: 20,
            indicators: ["apertura", "desarrollo", "cierre"],
          },
          {
            id: "content",
            title: "Contenido y datos",
            weight: 30,
            indicators: ["relevancia", "precisión", "evidencia"],
          },
          {
            id: "delivery",
            title: "Entrega y comunicación",
            weight: 25,
            indicators: ["claridad", "contacto visual", "voz"],
          },
          {
            id: "visuals",
            title: "Apoyo visual",
            weight: 15,
            indicators: ["diseño", "legibilidad", "pertinencia"],
          },
          {
            id: "qa",
            title: "Manejo de preguntas",
            weight: 10,
            indicators: ["escucha", "respuesta", "profesionalismo"],
          },
        ],
      },
    ];

    const results = [];
    for (const scenarioData of scenarios) {
      try {
        const existing = await this.prisma.eCSimulation.findFirst({
          where: { ecId: ecStandardId, code: scenarioData.code },
        });

        if (!existing) {
          const created = await this.prisma.eCSimulation.create({
            data: scenarioData,
          });
          results.push(created);
        }
      } catch (error) {
        this.logger.error(`Error seeding scenario:`, error);
      }
    }

    return results;
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getScenarioStats(ecStandardId?: string) {
    const where: Record<string, unknown> = {};
    if (ecStandardId) where.ecId = ecStandardId;

    const [total, byType] = await Promise.all([
      this.prisma.eCSimulation.count({ where }),
      this.prisma.eCSimulation.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateCode(type: SimulationType): string {
    const prefix =
      type === SimulationType.INTERVIEW
        ? "ENT"
        : type === SimulationType.PRESENTATION
          ? "PRES"
          : "SIM";
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { CurriculumController } from "./curriculum.controller";
import { ModulesService } from "./modules.service";
import { LessonsService } from "./lessons.service";
import { CompetencyMappingService } from "./competency-mapping.service";

describe("CurriculumController", () => {
  let controller: CurriculumController;
  let modulesService: jest.Mocked<ModulesService>;
  let lessonsService: jest.Mocked<LessonsService>;
  let competencyMappingService: jest.Mocked<CompetencyMappingService>;

  const mockTenantId = "tenant-1";

  const mockModulesService = {
    create: jest.fn(),
    findByCourse: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
  };

  const mockLessonsService = {
    create: jest.fn(),
    findByModule: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
    updateContent: jest.fn(),
  };

  const mockCompetencyMappingService = {
    getAvailableCriteria: jest.fn(),
    getLessonMapping: jest.fn(),
    toggleMapping: jest.fn(),
    setLessonMappings: jest.fn(),
    getCourseMappingStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurriculumController],
      providers: [
        { provide: ModulesService, useValue: mockModulesService },
        { provide: LessonsService, useValue: mockLessonsService },
        {
          provide: CompetencyMappingService,
          useValue: mockCompetencyMappingService,
        },
      ],
    }).compile();

    controller = module.get<CurriculumController>(CurriculumController);
    modulesService = module.get(ModulesService);
    lessonsService = module.get(LessonsService);
    competencyMappingService = module.get(CompetencyMappingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // MODULE TESTS
  describe("createModule", () => {
    it("should create module", async () => {
      modulesService.create.mockResolvedValue({ id: "mod-1" } as any);
      await controller.createModule(mockTenantId, "course-1", {} as any);
      expect(modulesService.create).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
        {},
      );
    });
  });

  describe("getModulesByCourse", () => {
    it("should get modules by course", async () => {
      modulesService.findByCourse.mockResolvedValue([]);
      await controller.getModulesByCourse(mockTenantId, "course-1");
      expect(modulesService.findByCourse).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
      );
    });
  });

  describe("getModule", () => {
    it("should get module by id", async () => {
      modulesService.findById.mockResolvedValue({} as any);
      await controller.getModule(mockTenantId, "mod-1");
      expect(modulesService.findById).toHaveBeenCalledWith(
        mockTenantId,
        "mod-1",
      );
    });
  });

  describe("updateModule", () => {
    it("should update module", async () => {
      modulesService.update.mockResolvedValue({} as any);
      await controller.updateModule(mockTenantId, "mod-1", {} as any);
      expect(modulesService.update).toHaveBeenCalledWith(
        mockTenantId,
        "mod-1",
        {},
      );
    });
  });

  describe("deleteModule", () => {
    it("should delete module", async () => {
      modulesService.delete.mockResolvedValue({} as any);
      await controller.deleteModule(mockTenantId, "mod-1");
      expect(modulesService.delete).toHaveBeenCalledWith(mockTenantId, "mod-1");
    });
  });

  describe("reorderModules", () => {
    it("should reorder modules", async () => {
      const orders = [{ id: "mod-1", order: 0 }];
      modulesService.reorder.mockResolvedValue([]);
      await controller.reorderModules(mockTenantId, "course-1", orders);
      expect(modulesService.reorder).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
        orders,
      );
    });
  });

  // LESSON TESTS
  describe("createLesson", () => {
    it("should create lesson", async () => {
      lessonsService.create.mockResolvedValue({ id: "lesson-1" } as any);
      await controller.createLesson(mockTenantId, "mod-1", {} as any);
      expect(lessonsService.create).toHaveBeenCalledWith(
        mockTenantId,
        "mod-1",
        {},
      );
    });
  });

  describe("getLessonsByModule", () => {
    it("should get lessons by module", async () => {
      lessonsService.findByModule.mockResolvedValue([]);
      await controller.getLessonsByModule(mockTenantId, "mod-1");
      expect(lessonsService.findByModule).toHaveBeenCalledWith(
        mockTenantId,
        "mod-1",
      );
    });
  });

  describe("getLesson", () => {
    it("should get lesson by id", async () => {
      lessonsService.findById.mockResolvedValue({} as any);
      await controller.getLesson(mockTenantId, "lesson-1");
      expect(lessonsService.findById).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
      );
    });
  });

  describe("updateLesson", () => {
    it("should update lesson", async () => {
      lessonsService.update.mockResolvedValue({} as any);
      await controller.updateLesson(mockTenantId, "lesson-1", {} as any);
      expect(lessonsService.update).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
        {},
      );
    });
  });

  describe("deleteLesson", () => {
    it("should delete lesson", async () => {
      lessonsService.delete.mockResolvedValue({} as any);
      await controller.deleteLesson(mockTenantId, "lesson-1");
      expect(lessonsService.delete).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
      );
    });
  });

  describe("reorderLessons", () => {
    it("should reorder lessons", async () => {
      const orders = [{ id: "lesson-1", order: 0 }];
      lessonsService.reorder.mockResolvedValue([]);
      await controller.reorderLessons(mockTenantId, "mod-1", orders);
      expect(lessonsService.reorder).toHaveBeenCalledWith(
        mockTenantId,
        "mod-1",
        orders,
      );
    });
  });

  describe("updateLessonContent", () => {
    it("should update lesson content", async () => {
      const dto = { title: "Updated" };
      lessonsService.updateContent.mockResolvedValue({} as any);
      await controller.updateLessonContent(
        mockTenantId,
        "lesson-1",
        dto as any,
      );
      expect(lessonsService.updateContent).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
        dto,
      );
    });
  });

  // COMPETENCY MAPPING TESTS
  describe("getAvailableCriteria", () => {
    it("should get available criteria", async () => {
      competencyMappingService.getAvailableCriteria.mockResolvedValue(
        {} as any,
      );
      await controller.getAvailableCriteria(mockTenantId, "course-1");
      expect(
        competencyMappingService.getAvailableCriteria,
      ).toHaveBeenCalledWith(mockTenantId, "course-1");
    });
  });

  describe("getLessonMapping", () => {
    it("should get lesson mapping", async () => {
      competencyMappingService.getLessonMapping.mockResolvedValue({} as any);
      await controller.getLessonMapping(mockTenantId, "lesson-1");
      expect(competencyMappingService.getLessonMapping).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
      );
    });
  });

  describe("toggleMapping", () => {
    it("should toggle mapping", async () => {
      competencyMappingService.toggleMapping.mockResolvedValue({} as any);
      await controller.toggleMapping(mockTenantId, "lesson-1", "crit-1");
      expect(competencyMappingService.toggleMapping).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
        "crit-1",
      );
    });
  });

  describe("setLessonMappings", () => {
    it("should set lesson mappings", async () => {
      const body = { criteriaIds: ["crit-1", "crit-2"] };
      competencyMappingService.setLessonMappings.mockResolvedValue({} as any);
      await controller.setLessonMappings(mockTenantId, "lesson-1", body);
      expect(competencyMappingService.setLessonMappings).toHaveBeenCalledWith(
        mockTenantId,
        "lesson-1",
        body.criteriaIds,
      );
    });
  });

  describe("getCourseMappingStats", () => {
    it("should get course mapping stats", async () => {
      competencyMappingService.getCourseMappingStats.mockResolvedValue(
        {} as any,
      );
      await controller.getCourseMappingStats(mockTenantId, "course-1");
      expect(
        competencyMappingService.getCourseMappingStats,
      ).toHaveBeenCalledWith(mockTenantId, "course-1");
    });
  });
});

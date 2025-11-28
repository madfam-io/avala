import { Test, TestingModule } from "@nestjs/testing";
import { ECConfigController } from "./ec-config.controller";
import { ECConfigService } from "./ec-config.service";

describe("ECConfigController", () => {
  let controller: ECConfigController;
  let ecConfigService: jest.Mocked<ECConfigService>;

  const mockECConfigService = {
    // Standards
    createStandard: jest.fn(),
    findAllStandards: jest.fn(),
    findStandardByCode: jest.fn(),
    getStandardOverview: jest.fn(),
    updateStandard: jest.fn(),
    deleteStandard: jest.fn(),
    publishStandard: jest.fn(),
    deprecateStandard: jest.fn(),
    cloneStandard: jest.fn(),
    // Elements
    createElement: jest.fn(),
    findElementsByStandard: jest.fn(),
    findElementById: jest.fn(),
    updateElement: jest.fn(),
    deleteElement: jest.fn(),
    // Modules
    createModule: jest.fn(),
    findModulesByStandard: jest.fn(),
    findModuleById: jest.fn(),
    updateModule: jest.fn(),
    deleteModule: jest.fn(),
    // Lessons
    createLesson: jest.fn(),
    findLessonsByModule: jest.fn(),
    findLessonById: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ECConfigController],
      providers: [{ provide: ECConfigService, useValue: mockECConfigService }],
    }).compile();

    controller = module.get<ECConfigController>(ECConfigController);
    ecConfigService = module.get(ECConfigService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // STANDARDS
  describe("createStandard", () => {
    it("should create EC standard", async () => {
      ecConfigService.createStandard.mockResolvedValue({} as any);
      await controller.createStandard({} as any);
      expect(ecConfigService.createStandard).toHaveBeenCalledWith({});
    });
  });

  describe("findAllStandards", () => {
    it("should find all standards", async () => {
      ecConfigService.findAllStandards.mockResolvedValue({
        data: [],
        total: 0,
      } as any);
      await controller.findAllStandards({} as any);
      expect(ecConfigService.findAllStandards).toHaveBeenCalledWith({});
    });
  });

  describe("findStandardByCode", () => {
    it("should find standard by code", async () => {
      ecConfigService.findStandardByCode.mockResolvedValue({} as any);
      await controller.findStandardByCode("EC0249");
      expect(ecConfigService.findStandardByCode).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("getStandardOverview", () => {
    it("should get standard overview", async () => {
      ecConfigService.getStandardOverview.mockResolvedValue({} as any);
      await controller.getStandardOverview("EC0249");
      expect(ecConfigService.getStandardOverview).toHaveBeenCalledWith(
        "EC0249",
      );
    });
  });

  describe("updateStandard", () => {
    it("should update standard", async () => {
      ecConfigService.updateStandard.mockResolvedValue({} as any);
      await controller.updateStandard("EC0249", {} as any);
      expect(ecConfigService.updateStandard).toHaveBeenCalledWith("EC0249", {});
    });
  });

  describe("deleteStandard", () => {
    it("should delete standard", async () => {
      ecConfigService.deleteStandard.mockResolvedValue({} as any);
      await controller.deleteStandard("EC0249");
      expect(ecConfigService.deleteStandard).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("publishStandard", () => {
    it("should publish standard", async () => {
      ecConfigService.publishStandard.mockResolvedValue({} as any);
      await controller.publishStandard("EC0249");
      expect(ecConfigService.publishStandard).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("deprecateStandard", () => {
    it("should deprecate standard", async () => {
      ecConfigService.deprecateStandard.mockResolvedValue({} as any);
      await controller.deprecateStandard("EC0249");
      expect(ecConfigService.deprecateStandard).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("cloneStandard", () => {
    it("should clone standard", async () => {
      ecConfigService.cloneStandard.mockResolvedValue({} as any);
      await controller.cloneStandard("EC0249", {
        newCode: "EC0250",
        newTitle: "New",
      });
      expect(ecConfigService.cloneStandard).toHaveBeenCalledWith(
        "EC0249",
        "EC0250",
        "New",
      );
    });
  });

  // ELEMENTS
  describe("createElement", () => {
    it("should create element", async () => {
      ecConfigService.createElement.mockResolvedValue({} as any);
      await controller.createElement("EC0249", {} as any);
      expect(ecConfigService.createElement).toHaveBeenCalledWith("EC0249", {});
    });
  });

  describe("findElements", () => {
    it("should find elements by standard", async () => {
      ecConfigService.findElementsByStandard.mockResolvedValue([]);
      await controller.findElements("EC0249");
      expect(ecConfigService.findElementsByStandard).toHaveBeenCalledWith(
        "EC0249",
      );
    });
  });

  describe("findElementById", () => {
    it("should find element by id", async () => {
      ecConfigService.findElementById.mockResolvedValue({} as any);
      await controller.findElementById("elem-1");
      expect(ecConfigService.findElementById).toHaveBeenCalledWith("elem-1");
    });
  });

  describe("updateElement", () => {
    it("should update element", async () => {
      ecConfigService.updateElement.mockResolvedValue({} as any);
      await controller.updateElement("elem-1", {} as any);
      expect(ecConfigService.updateElement).toHaveBeenCalledWith("elem-1", {});
    });
  });

  describe("deleteElement", () => {
    it("should delete element", async () => {
      ecConfigService.deleteElement.mockResolvedValue({} as any);
      await controller.deleteElement("elem-1");
      expect(ecConfigService.deleteElement).toHaveBeenCalledWith("elem-1");
    });
  });

  // MODULES
  describe("createModule", () => {
    it("should create module", async () => {
      ecConfigService.createModule.mockResolvedValue({} as any);
      await controller.createModule("EC0249", {} as any);
      expect(ecConfigService.createModule).toHaveBeenCalledWith("EC0249", {});
    });
  });

  describe("findModules", () => {
    it("should find modules by standard", async () => {
      ecConfigService.findModulesByStandard.mockResolvedValue([]);
      await controller.findModules("EC0249");
      expect(ecConfigService.findModulesByStandard).toHaveBeenCalledWith(
        "EC0249",
      );
    });
  });

  describe("findModuleById", () => {
    it("should find module by id", async () => {
      ecConfigService.findModuleById.mockResolvedValue({} as any);
      await controller.findModuleById("mod-1");
      expect(ecConfigService.findModuleById).toHaveBeenCalledWith("mod-1");
    });
  });

  describe("updateModule", () => {
    it("should update module", async () => {
      ecConfigService.updateModule.mockResolvedValue({} as any);
      await controller.updateModule("mod-1", {} as any);
      expect(ecConfigService.updateModule).toHaveBeenCalledWith("mod-1", {});
    });
  });

  describe("deleteModule", () => {
    it("should delete module", async () => {
      ecConfigService.deleteModule.mockResolvedValue({} as any);
      await controller.deleteModule("mod-1");
      expect(ecConfigService.deleteModule).toHaveBeenCalledWith("mod-1");
    });
  });

  // LESSONS
  describe("createLesson", () => {
    it("should create lesson", async () => {
      ecConfigService.createLesson.mockResolvedValue({} as any);
      await controller.createLesson("mod-1", {} as any);
      expect(ecConfigService.createLesson).toHaveBeenCalledWith("mod-1", {});
    });
  });

  describe("findLessons", () => {
    it("should find lessons by module", async () => {
      ecConfigService.findLessonsByModule.mockResolvedValue([]);
      await controller.findLessons("mod-1");
      expect(ecConfigService.findLessonsByModule).toHaveBeenCalledWith("mod-1");
    });
  });

  describe("findLessonById", () => {
    it("should find lesson by id", async () => {
      ecConfigService.findLessonById.mockResolvedValue({} as any);
      await controller.findLessonById("lesson-1");
      expect(ecConfigService.findLessonById).toHaveBeenCalledWith("lesson-1");
    });
  });

  describe("updateLesson", () => {
    it("should update lesson", async () => {
      ecConfigService.updateLesson.mockResolvedValue({} as any);
      await controller.updateLesson("lesson-1", {} as any);
      expect(ecConfigService.updateLesson).toHaveBeenCalledWith("lesson-1", {});
    });
  });

  describe("deleteLesson", () => {
    it("should delete lesson", async () => {
      ecConfigService.deleteLesson.mockResolvedValue({} as any);
      await controller.deleteLesson("lesson-1");
      expect(ecConfigService.deleteLesson).toHaveBeenCalledWith("lesson-1");
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

describe("CoursesController", () => {
  let controller: CoursesController;
  let coursesService: jest.Mocked<CoursesService>;

  const mockTenantId = "tenant-1";
  const mockUserId = "user-1";

  const mockCoursesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    getCurriculum: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockCoursesService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    coursesService = module.get(CoursesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a course", async () => {
      const dto = { title: "Test Course" };
      coursesService.create.mockResolvedValue({ id: "course-1" } as any);
      await controller.create(mockTenantId, mockUserId, dto as any);
      expect(coursesService.create).toHaveBeenCalledWith(mockTenantId, {
        ...dto,
        ownerId: mockUserId,
      });
    });
  });

  describe("findAll", () => {
    it("should return all courses with pagination", async () => {
      const mockQuery = { page: 1, limit: 20 };
      const mockResult = {
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      coursesService.findAll.mockResolvedValue(mockResult as any);
      await controller.findAll(mockTenantId, mockQuery as any);
      expect(coursesService.findAll).toHaveBeenCalledWith(
        mockTenantId,
        mockQuery,
      );
    });
  });

  describe("search", () => {
    it("should search courses", async () => {
      coursesService.search.mockResolvedValue([]);
      await controller.search(mockTenantId, "test");
      expect(coursesService.search).toHaveBeenCalledWith(mockTenantId, "test");
    });
  });

  describe("getCurriculum", () => {
    it("should get course curriculum", async () => {
      coursesService.getCurriculum.mockResolvedValue({} as any);
      await controller.getCurriculum(mockTenantId, "course-1");
      expect(coursesService.getCurriculum).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
      );
    });
  });

  describe("findById", () => {
    it("should find course by id", async () => {
      coursesService.findById.mockResolvedValue({} as any);
      await controller.findById(mockTenantId, "course-1");
      expect(coursesService.findById).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
      );
    });
  });

  describe("update", () => {
    it("should update a course", async () => {
      const dto = { title: "Updated" };
      coursesService.update.mockResolvedValue({} as any);
      await controller.update(mockTenantId, "course-1", dto as any);
      expect(coursesService.update).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
        dto,
      );
    });
  });

  describe("delete", () => {
    it("should delete a course", async () => {
      coursesService.delete.mockResolvedValue({} as any);
      await controller.delete(mockTenantId, "course-1");
      expect(coursesService.delete).toHaveBeenCalledWith(
        mockTenantId,
        "course-1",
      );
    });
  });
});

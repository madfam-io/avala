import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockTenantId = "tenant-1";

  const mockUserService = {
    findAll: jest.fn(),
    countByRole: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      userService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
      } as any);
      await controller.findAll(mockTenantId, {} as any);
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe("countByRole", () => {
    it("should return user count by role", async () => {
      userService.countByRole.mockResolvedValue({} as any);
      await controller.countByRole(mockTenantId);
      expect(userService.countByRole).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      userService.findById.mockResolvedValue({} as any);
      await controller.findById(mockTenantId, "user-1");
      expect(userService.findById).toHaveBeenCalledWith(mockTenantId, "user-1");
    });
  });

  describe("create", () => {
    it("should create a user", async () => {
      userService.create.mockResolvedValue({} as any);
      await controller.create(mockTenantId, {} as any);
      expect(userService.create).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      userService.update.mockResolvedValue({} as any);
      await controller.update(mockTenantId, "user-1", {} as any);
      expect(userService.update).toHaveBeenCalledWith(
        mockTenantId,
        "user-1",
        {},
      );
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      userService.delete.mockResolvedValue({} as any);
      await controller.delete(mockTenantId, "user-1");
      expect(userService.delete).toHaveBeenCalledWith(mockTenantId, "user-1");
    });
  });
});

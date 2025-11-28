import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { PrismaService } from '../../database/prisma.service';

describe('ModulesService', () => {
  let service: ModulesService;

  const mockTenantId = 'tenant-123';
  const mockCourseId = 'course-456';
  const mockModuleId = 'module-789';

  const mockModule = {
    id: mockModuleId,
    title: 'Test Module',
    order: 0,
    courseId: mockCourseId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCourse = {
    id: mockCourseId,
    code: 'COURSE-001',
    title: 'Test Course',
    _count: { modules: 2 },
  };

  const mockTenantClient = {
    course: {
      findUnique: jest.fn(),
    },
    module: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPrisma = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
  });

  describe('create', () => {
    const createDto = {
      title: 'New Module',
      order: 1,
    };

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.module.create.mockResolvedValue({
        ...mockModule,
        ...createDto,
        lessons: [],
      });
    });

    it('should create a new module', async () => {
      const result = await service.create(mockTenantId, mockCourseId, createDto);

      expect(result.title).toBe(createDto.title);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
      expect(mockTenantClient.module.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course not found', async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, mockCourseId, createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCourse', () => {
    const mockModules = [
      { ...mockModule, order: 0, lessons: [], _count: { lessons: 3 } },
      { ...mockModule, id: 'module-2', order: 1, lessons: [], _count: { lessons: 5 } },
    ];

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.module.findMany.mockResolvedValue(mockModules);
    });

    it('should return all modules for a course', async () => {
      const result = await service.findByCourse(mockTenantId, mockCourseId);

      expect(result).toEqual(mockModules);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCourse(mockTenantId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    const mockModuleWithDetails = {
      ...mockModule,
      course: mockCourse,
      lessons: [
        { id: 'lesson-1', title: 'Lesson 1', order: 0 },
        { id: 'lesson-2', title: 'Lesson 2', order: 1 },
      ],
    };

    it('should return a module by ID', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(mockModuleWithDetails);

      const result = await service.findById(mockTenantId, mockModuleId);

      expect(result).toEqual(mockModuleWithDetails);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockTenantId, mockModuleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Module',
      order: 2,
    };

    const updatedModule = {
      ...mockModule,
      ...updateDto,
      lessons: [],
    };

    beforeEach(() => {
      mockTenantClient.module.findUnique.mockResolvedValue(mockModule);
      mockTenantClient.module.update.mockResolvedValue(updatedModule);
    });

    it('should update a module', async () => {
      const result = await service.update(mockTenantId, mockModuleId, updateDto);

      expect(result).toEqual(updatedModule);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockModuleId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    const moduleWithCount = {
      ...mockModule,
      _count: { lessons: 5 },
    };

    beforeEach(() => {
      mockTenantClient.module.findUnique.mockResolvedValue(moduleWithCount);
      mockTenantClient.module.delete.mockResolvedValue(mockModule);
    });

    it('should delete a module', async () => {
      const result = await service.delete(mockTenantId, mockModuleId);

      expect(result).toEqual(mockModule);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(service.delete(mockTenantId, mockModuleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    const moduleOrders = [
      { id: 'module-1', order: 2 },
      { id: 'module-2', order: 0 },
    ];

    const reorderedModules = [
      { ...mockModule, id: 'module-2', order: 0 },
      { ...mockModule, id: 'module-1', order: 2 },
    ];

    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.$transaction.mockResolvedValue([]);
      mockTenantClient.module.findMany.mockResolvedValue(reorderedModules);
    });

    it('should reorder modules in a course', async () => {
      const result = await service.reorder(mockTenantId, mockCourseId, moduleOrders);

      expect(result).toEqual(reorderedModules);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.reorder(mockTenantId, mockCourseId, moduleOrders),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../../database/prisma.service';

describe('LessonsService', () => {
  let service: LessonsService;

  const mockTenantId = 'tenant-123';
  const mockModuleId = 'module-456';
  const mockLessonId = 'lesson-789';

  const mockLesson = {
    id: mockLessonId,
    title: 'Test Lesson',
    order: 0,
    content: 'Lesson content',
    videoUrl: 'https://example.com/video.mp4',
    contentRef: null,
    durationMin: 30,
    moduleId: mockModuleId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModule = {
    id: mockModuleId,
    title: 'Test Module',
    courseId: 'course-123',
    _count: { lessons: 3 },
  };

  const mockTenantClient = {
    module: {
      findUnique: jest.fn(),
    },
    lesson: {
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
        LessonsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  describe('create', () => {
    const createDto = {
      title: 'New Lesson',
      order: 1,
      content: 'New lesson content',
      videoUrl: 'https://example.com/new-video.mp4',
      durationMin: 45,
    };

    beforeEach(() => {
      mockTenantClient.module.findUnique.mockResolvedValue(mockModule);
      mockTenantClient.lesson.create.mockResolvedValue({
        ...mockLesson,
        ...createDto,
      });
    });

    it('should create a new lesson', async () => {
      const result = await service.create(mockTenantId, mockModuleId, createDto);

      expect(result.title).toBe(createDto.title);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
      expect(mockTenantClient.lesson.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, mockModuleId, createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByModule', () => {
    const mockLessons = [
      { ...mockLesson, order: 0, _count: { criteria: 2 } },
      { ...mockLesson, id: 'lesson-2', order: 1, _count: { criteria: 3 } },
    ];

    beforeEach(() => {
      mockTenantClient.module.findUnique.mockResolvedValue(mockModule);
      mockTenantClient.lesson.findMany.mockResolvedValue(mockLessons);
    });

    it('should return all lessons for a module', async () => {
      const result = await service.findByModule(mockTenantId, mockModuleId);

      expect(result).toEqual(mockLessons);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(
        service.findByModule(mockTenantId, mockModuleId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    const mockLessonWithDetails = {
      ...mockLesson,
      module: {
        ...mockModule,
        course: { id: 'course-123', title: 'Test Course' },
      },
      _count: { criteria: 4 },
    };

    it('should return a lesson by ID', async () => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(mockLessonWithDetails);

      const result = await service.findById(mockTenantId, mockLessonId);

      expect(result).toEqual(mockLessonWithDetails);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockTenantId, mockLessonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Lesson',
      order: 2,
      content: 'Updated content',
    };

    const updatedLesson = {
      ...mockLesson,
      ...updateDto,
    };

    beforeEach(() => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(mockLesson);
      mockTenantClient.lesson.update.mockResolvedValue(updatedLesson);
    });

    it('should update a lesson', async () => {
      const result = await service.update(mockTenantId, mockLessonId, updateDto);

      expect(result).toEqual(updatedLesson);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockLessonId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(mockLesson);
      mockTenantClient.lesson.delete.mockResolvedValue(mockLesson);
    });

    it('should delete a lesson', async () => {
      const result = await service.delete(mockTenantId, mockLessonId);

      expect(result).toEqual(mockLesson);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockTenantClient.lesson.findUnique.mockResolvedValue(null);

      await expect(service.delete(mockTenantId, mockLessonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    const lessonOrders = [
      { id: 'lesson-1', order: 2 },
      { id: 'lesson-2', order: 0 },
    ];

    const reorderedLessons = [
      { ...mockLesson, id: 'lesson-2', order: 0 },
      { ...mockLesson, id: 'lesson-1', order: 2 },
    ];

    beforeEach(() => {
      mockTenantClient.module.findUnique.mockResolvedValue(mockModule);
      mockTenantClient.$transaction.mockResolvedValue([]);
      mockTenantClient.lesson.findMany.mockResolvedValue(reorderedLessons);
    });

    it('should reorder lessons in a module', async () => {
      const result = await service.reorder(mockTenantId, mockModuleId, lessonOrders);

      expect(result).toEqual(reorderedLessons);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockTenantClient.module.findUnique.mockResolvedValue(null);

      await expect(
        service.reorder(mockTenantId, mockModuleId, lessonOrders),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ProgressStatus, CourseEnrollmentStatus } from '@avala/db';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockTenantId = 'tenant-123';
  const mockEnrollmentId = 'enrollment-123';
  const mockLessonId = 'lesson-123';

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: 'user-123',
    courseId: 'course-123',
    status: CourseEnrollmentStatus.IN_PROGRESS,
    progress: [],
  };

  const mockProgress = {
    id: 'progress-123',
    enrollmentId: mockEnrollmentId,
    lessonId: mockLessonId,
    status: ProgressStatus.NOT_STARTED,
    viewedAt: null,
    completedAt: null,
  };

  const mockTenantClient = {
    courseEnrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lessonProgress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockPrismaService = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markLessonInProgress', () => {
    it('should create progress record if not exists', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(null);
      mockTenantClient.lessonProgress.create.mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.IN_PROGRESS,
        viewedAt: new Date(),
      });

      const result = await service.markLessonInProgress(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(mockTenantClient.lessonProgress.create).toHaveBeenCalled();
      expect(result.status).toBe(ProgressStatus.IN_PROGRESS);
    });

    it('should update status to IN_PROGRESS if NOT_STARTED', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(mockProgress);
      mockTenantClient.lessonProgress.update.mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.IN_PROGRESS,
        viewedAt: new Date(),
      });

      const result = await service.markLessonInProgress(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(mockTenantClient.lessonProgress.update).toHaveBeenCalled();
      expect(result.status).toBe(ProgressStatus.IN_PROGRESS);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.markLessonInProgress(mockTenantId, 'invalid-id', mockLessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markLessonComplete', () => {
    it('should mark lesson as completed', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockTenantClient.lessonProgress.upsert.mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockTenantClient.lessonProgress.findMany.mockResolvedValue([
        { status: ProgressStatus.COMPLETED },
      ]);

      const result = await service.markLessonComplete(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(result.progress.status).toBe(ProgressStatus.COMPLETED);
      expect(result.enrollmentCompleted).toBe(true);
    });

    it('should auto-complete enrollment when all lessons complete', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockTenantClient.lessonProgress.upsert.mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.COMPLETED,
      });
      mockTenantClient.lessonProgress.findMany.mockResolvedValue([
        { status: ProgressStatus.COMPLETED },
        { status: ProgressStatus.COMPLETED },
      ]);
      mockTenantClient.courseEnrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: CourseEnrollmentStatus.COMPLETED,
      });

      const result = await service.markLessonComplete(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(mockTenantClient.courseEnrollment.update).toHaveBeenCalledWith({
        where: { id: mockEnrollmentId },
        data: expect.objectContaining({
          status: CourseEnrollmentStatus.COMPLETED,
        }),
      });
      expect(result.enrollmentCompleted).toBe(true);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.markLessonComplete(mockTenantId, 'invalid-id', mockLessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetLessonProgress', () => {
    it('should reset progress to NOT_STARTED', async () => {
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(mockProgress);
      mockTenantClient.lessonProgress.update.mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.NOT_STARTED,
        viewedAt: null,
        completedAt: null,
      });

      const result = await service.resetLessonProgress(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(result.status).toBe(ProgressStatus.NOT_STARTED);
      expect(result.viewedAt).toBeNull();
    });

    it('should throw NotFoundException if progress not found', async () => {
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.resetLessonProgress(mockTenantId, mockEnrollmentId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLessonProgress', () => {
    it('should return lesson progress with details', async () => {
      const progressWithLesson = {
        ...mockProgress,
        lesson: {
          id: mockLessonId,
          title: 'Test Lesson',
          module: { id: 'module-1', title: 'Module 1' },
        },
      };
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(progressWithLesson);

      const result = await service.getLessonProgress(
        mockTenantId,
        mockEnrollmentId,
        mockLessonId,
      );

      expect(result).toEqual(progressWithLesson);
    });

    it('should throw NotFoundException if progress not found', async () => {
      mockTenantClient.lessonProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.getLessonProgress(mockTenantId, mockEnrollmentId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNextLesson', () => {
    it('should return first incomplete lesson', async () => {
      const enrollmentWithCourse = {
        ...mockEnrollment,
        course: {
          modules: [
            {
              id: 'module-1',
              title: 'Module 1',
              lessons: [
                { id: 'lesson-1', title: 'Lesson 1' },
                { id: 'lesson-2', title: 'Lesson 2' },
              ],
            },
          ],
        },
        progress: [{ lessonId: 'lesson-1', status: ProgressStatus.COMPLETED }],
      };
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(enrollmentWithCourse);

      const result = await service.getNextLesson(mockTenantId, mockEnrollmentId);

      expect(result?.lessonId).toBe('lesson-2');
      expect(result?.lessonTitle).toBe('Lesson 2');
    });

    it('should return null when all lessons complete', async () => {
      const enrollmentWithCourse = {
        ...mockEnrollment,
        course: {
          modules: [
            {
              id: 'module-1',
              title: 'Module 1',
              lessons: [{ id: 'lesson-1', title: 'Lesson 1' }],
            },
          ],
        },
        progress: [{ lessonId: 'lesson-1', status: ProgressStatus.COMPLETED }],
      };
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(enrollmentWithCourse);

      const result = await service.getNextLesson(mockTenantId, mockEnrollmentId);

      expect(result).toBeNull();
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.getNextLesson(mockTenantId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

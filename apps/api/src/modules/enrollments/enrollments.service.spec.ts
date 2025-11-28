import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { CourseEnrollmentStatus, ProgressStatus } from '@avala/db';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const mockCourseId = 'course-789';
  const mockEnrollmentId = 'enrollment-101';

  const mockLesson1 = {
    id: 'lesson-1',
    title: 'Introduction',
    order: 1,
  };

  const mockLesson2 = {
    id: 'lesson-2',
    title: 'Advanced Topics',
    order: 2,
  };

  const mockModule = {
    id: 'module-1',
    title: 'Module 1',
    order: 1,
    lessons: [mockLesson1, mockLesson2],
  };

  const mockCourse = {
    id: mockCourseId,
    code: 'COURSE-001',
    title: 'Test Course',
    description: 'A test course',
    durationHours: 10,
    tenantId: mockTenantId,
    modules: [mockModule],
  };

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: mockUserId,
    courseId: mockCourseId,
    status: CourseEnrollmentStatus.IN_PROGRESS,
    enrolledAt: new Date(),
    completedAt: null,
    course: mockCourse,
    user: mockUser,
    progress: [],
  };

  const mockTenantClient = {
    course: {
      findUnique: jest.fn(),
    },
    courseEnrollment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    lessonProgress: {
      createMany: jest.fn(),
    },
  };

  const mockPrisma = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
  };

  const mockMailService = {
    sendEnrollmentEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  describe('enroll', () => {
    beforeEach(() => {
      mockTenantClient.course.findUnique.mockResolvedValue(mockCourse);
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);
      mockTenantClient.courseEnrollment.create.mockResolvedValue({
        ...mockEnrollment,
        course: mockCourse,
      });
      mockTenantClient.lessonProgress.createMany.mockResolvedValue({ count: 2 });
      mockMailService.sendEnrollmentEmail.mockResolvedValue(undefined);
    });

    it('should create a new enrollment when user is not already enrolled', async () => {
      const finalEnrollment = {
        ...mockEnrollment,
        progress: [{ lessonId: 'lesson-1' }, { lessonId: 'lesson-2' }],
      };
      mockTenantClient.courseEnrollment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(finalEnrollment);

      const result = await service.enroll(mockTenantId, mockUserId, mockCourseId);

      expect(result.isNew).toBe(true);
      expect(result.enrollment).toEqual(finalEnrollment);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should return existing enrollment when user is already enrolled', async () => {
      const existingEnrollment = {
        ...mockEnrollment,
        progress: [{ lessonId: 'lesson-1' }],
      };
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(existingEnrollment);

      const result = await service.enroll(mockTenantId, mockUserId, mockCourseId);

      expect(result.isNew).toBe(false);
      expect(result.enrollment).toEqual(existingEnrollment);
      expect(mockTenantClient.courseEnrollment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockTenantClient.course.findUnique.mockResolvedValue(null);

      await expect(
        service.enroll(mockTenantId, mockUserId, mockCourseId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyCourses', () => {
    const mockEnrollment1 = {
      id: 'enrollment-1',
      userId: mockUserId,
      courseId: 'course-1',
      status: CourseEnrollmentStatus.IN_PROGRESS,
      enrolledAt: new Date('2024-01-01'),
      completedAt: null,
      course: {
        id: 'course-1',
        code: 'COURSE-001',
        title: 'Course 1',
        description: 'Description 1',
        durationHours: 10,
        modules: [{ _count: { lessons: 5 } }],
        _count: { modules: 1 },
      },
      progress: [
        { id: 'p1', status: ProgressStatus.COMPLETED },
        { id: 'p2', status: ProgressStatus.COMPLETED },
        { id: 'p3', status: ProgressStatus.IN_PROGRESS },
        { id: 'p4', status: ProgressStatus.NOT_STARTED },
        { id: 'p5', status: ProgressStatus.NOT_STARTED },
      ],
    };

    beforeEach(() => {
      mockTenantClient.courseEnrollment.findMany.mockResolvedValue([mockEnrollment1]);
    });

    it('should return all courses a user is enrolled in with progress', async () => {
      const result = await service.getMyCourses(mockTenantId, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        enrollmentId: 'enrollment-1',
        courseId: 'course-1',
        courseCode: 'COURSE-001',
        courseTitle: 'Course 1',
        status: CourseEnrollmentStatus.IN_PROGRESS,
      });
    });

    it('should return empty array when user has no enrollments', async () => {
      mockTenantClient.courseEnrollment.findMany.mockResolvedValue([]);

      const result = await service.getMyCourses(mockTenantId, mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getEnrollmentProgress', () => {
    const mockDetailedEnrollment = {
      id: mockEnrollmentId,
      userId: mockUserId,
      courseId: mockCourseId,
      status: CourseEnrollmentStatus.IN_PROGRESS,
      enrolledAt: new Date(),
      completedAt: null,
      course: {
        id: mockCourseId,
        code: 'COURSE-001',
        title: 'Test Course',
        modules: [mockModule],
      },
      progress: [
        { lessonId: 'lesson-1', status: ProgressStatus.COMPLETED, completedAt: new Date() },
        { lessonId: 'lesson-2', status: ProgressStatus.NOT_STARTED, completedAt: null },
      ],
    };

    beforeEach(() => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockDetailedEnrollment);
    });

    it('should return detailed progress for an enrollment', async () => {
      const result = await service.getEnrollmentProgress(mockTenantId, mockEnrollmentId);

      expect(result).toMatchObject({
        enrollmentId: mockEnrollmentId,
        courseId: mockCourseId,
        courseTitle: 'Test Course',
        status: CourseEnrollmentStatus.IN_PROGRESS,
      });
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.getEnrollmentProgress(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unenroll', () => {
    beforeEach(() => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockTenantClient.courseEnrollment.delete.mockResolvedValue(mockEnrollment);
    });

    it('should successfully unenroll a user from a course', async () => {
      const result = await service.unenroll(mockTenantId, mockEnrollmentId);

      expect(result).toEqual({
        success: true,
        enrollmentId: mockEnrollmentId,
      });
      expect(mockTenantClient.courseEnrollment.delete).toHaveBeenCalledWith({
        where: { id: mockEnrollmentId },
      });
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.unenroll(mockTenantId, mockEnrollmentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTenantClient.courseEnrollment.delete).not.toHaveBeenCalled();
    });
  });
});

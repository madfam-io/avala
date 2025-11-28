import { Test, TestingModule } from "@nestjs/testing";
import { ECTrainingService } from "./ec-training.service";
import { EnrollmentManagementService } from "./services/enrollment-management.service";
import { LessonProgressService } from "./services/lesson-progress.service";
import { ProgressCalculationService } from "./services/progress-calculation.service";
import { EnrollmentAnalyticsService } from "./services/enrollment-analytics.service";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";

describe("ECTrainingService", () => {
  let service: ECTrainingService;
  let enrollmentManagementService: EnrollmentManagementService;
  let lessonProgressService: LessonProgressService;
  let progressCalculationService: ProgressCalculationService;
  let enrollmentAnalyticsService: EnrollmentAnalyticsService;

  // Mock data
  const mockUser = {
    id: "user-123",
    email: "trainee@test.com",
    firstName: "Test",
    lastName: "Trainee",
    role: "TRAINEE",
    tenantId: "tenant-123",
  };

  const mockECStandard = {
    id: "ec-123",
    code: "EC0249",
    title: "Diseño de cursos de capacitación",
    description: "EC Standard for training course design",
    version: "1.0",
    status: "PUBLISHED",
    estimatedHours: 40,
    thumbnailUrl: null,
    modules: [
      {
        id: "module-1",
        code: "MOD001",
        title: "Module 1",
        orderIndex: 0,
        estimatedMinutes: 60,
        icon: "book",
        lessons: [
          {
            id: "lesson-1",
            code: "LES001",
            title: "Lesson 1",
            videoId: "vid-1",
            orderIndex: 0,
            estimatedMinutes: 30,
          },
          {
            id: "lesson-2",
            code: "LES002",
            title: "Lesson 2",
            videoId: "vid-2",
            orderIndex: 1,
            estimatedMinutes: 30,
          },
        ],
        assessments: [],
      },
    ],
    templates: [],
  };

  const mockEnrollment = {
    id: "enrollment-123",
    userId: "user-123",
    ecId: "ec-123",
    tenantId: "tenant-123",
    status: "IN_PROGRESS",
    overallProgress: 0,
    enrolledAt: new Date(),
    completedAt: null,
    ec: mockECStandard,
    user: mockUser,
    moduleProgress: [
      {
        id: "mp-1",
        enrollmentId: "enrollment-123",
        moduleId: "module-1",
        progress: 0,
        status: "NOT_STARTED",
        startedAt: null,
        completedAt: null,
      },
    ],
    lessonProgress: [
      {
        id: "lp-1",
        enrollmentId: "enrollment-123",
        lessonId: "lesson-1",
        status: "NOT_STARTED",
        videoProgress: 0,
        startedAt: null,
        completedAt: null,
      },
      {
        id: "lp-2",
        enrollmentId: "enrollment-123",
        lessonId: "lesson-2",
        status: "NOT_STARTED",
        videoProgress: 0,
        startedAt: null,
        completedAt: null,
      },
    ],
    documents: [],
    assessmentAttempts: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECTrainingService,
        {
          provide: EnrollmentManagementService,
          useValue: {
            enrollUser: jest.fn(),
            findEnrollmentById: jest.fn(),
            findAllEnrollments: jest.fn(),
            findUserEnrollments: jest.fn(),
            findEnrollmentByUserAndEC: jest.fn(),
            withdrawEnrollment: jest.fn(),
            resetEnrollmentProgress: jest.fn(),
          },
        },
        {
          provide: LessonProgressService,
          useValue: {
            updateLessonProgress: jest.fn(),
            trackVideoProgress: jest.fn(),
            completeLesson: jest.fn(),
            updateModuleProgress: jest.fn(),
            startModule: jest.fn(),
          },
        },
        {
          provide: ProgressCalculationService,
          useValue: {
            getProgressSummary: jest.fn(),
            recalculateProgress: jest.fn(),
          },
        },
        {
          provide: EnrollmentAnalyticsService,
          useValue: {
            getECLeaderboard: jest.fn(),
            getRecentActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ECTrainingService>(ECTrainingService);
    enrollmentManagementService = module.get<EnrollmentManagementService>(
      EnrollmentManagementService,
    );
    lessonProgressService = module.get<LessonProgressService>(
      LessonProgressService,
    );
    progressCalculationService = module.get<ProgressCalculationService>(
      ProgressCalculationService,
    );
    enrollmentAnalyticsService = module.get<EnrollmentAnalyticsService>(
      EnrollmentAnalyticsService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("enrollUser", () => {
    const enrollDto = {
      userId: "user-123",
      tenantId: "tenant-123",
      ecCode: "EC0249",
    };

    it("should enroll user in EC standard successfully", async () => {
      jest
        .spyOn(enrollmentManagementService, "enrollUser")
        .mockResolvedValue(mockEnrollment as any);

      const result = await service.enrollUser(enrollDto);

      expect(result).toBeDefined();
      expect(result.id).toBe("enrollment-123");
      expect(enrollmentManagementService.enrollUser).toHaveBeenCalledWith(
        enrollDto,
      );
    });

    it("should throw NotFoundException when EC standard not found", async () => {
      jest
        .spyOn(enrollmentManagementService, "enrollUser")
        .mockRejectedValue(
          new NotFoundException("EC standard not found: EC0249"),
        );

      await expect(service.enrollUser(enrollDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when EC standard not published", async () => {
      jest
        .spyOn(enrollmentManagementService, "enrollUser")
        .mockRejectedValue(
          new BadRequestException(
            "Cannot enroll in unpublished EC standard: EC0249",
          ),
        );

      await expect(service.enrollUser(enrollDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw ConflictException when user already enrolled", async () => {
      jest
        .spyOn(enrollmentManagementService, "enrollUser")
        .mockRejectedValue(
          new ConflictException("User already enrolled in EC standard: EC0249"),
        );

      await expect(service.enrollUser(enrollDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("findEnrollmentById", () => {
    it("should return enrollment with related data", async () => {
      jest
        .spyOn(enrollmentManagementService, "findEnrollmentById")
        .mockResolvedValue(mockEnrollment as any);

      const result = await service.findEnrollmentById("enrollment-123");

      expect(result).toBeDefined();
      expect(result.id).toBe("enrollment-123");
      expect(
        enrollmentManagementService.findEnrollmentById,
      ).toHaveBeenCalledWith("enrollment-123");
    });

    it("should throw NotFoundException when enrollment not found", async () => {
      jest
        .spyOn(enrollmentManagementService, "findEnrollmentById")
        .mockRejectedValue(new NotFoundException("Enrollment not found"));

      await expect(service.findEnrollmentById("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAllEnrollments", () => {
    it("should return paginated enrollments", async () => {
      const mockResult = {
        data: [mockEnrollment],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      jest
        .spyOn(enrollmentManagementService, "findAllEnrollments")
        .mockResolvedValue(mockResult as any);

      const result = await service.findAllEnrollments({
        tenantId: "tenant-123",
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("should filter by status", async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      jest
        .spyOn(enrollmentManagementService, "findAllEnrollments")
        .mockResolvedValue(mockResult as any);

      await service.findAllEnrollments({
        tenantId: "tenant-123",
        status: "COMPLETED",
        page: 1,
        limit: 10,
      });

      expect(
        enrollmentManagementService.findAllEnrollments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "COMPLETED",
        }),
      );
    });
  });

  describe("updateLessonProgress", () => {
    const mockLessonProgress = {
      id: "lp-1",
      enrollmentId: "enrollment-123",
      lessonId: "lesson-1",
      status: "COMPLETED",
      videoProgress: 100,
      startedAt: new Date(),
      completedAt: new Date(),
    };

    it("should update lesson progress and recalculate module progress", async () => {
      jest
        .spyOn(lessonProgressService, "updateLessonProgress")
        .mockResolvedValue(mockLessonProgress as any);

      const result = await service.updateLessonProgress(
        "enrollment-123",
        "lesson-1",
        {
          videoProgress: 100,
          markCompleted: true,
        },
      );

      expect(result).toBeDefined();
      expect(lessonProgressService.updateLessonProgress).toHaveBeenCalled();
    });

    it("should throw NotFoundException when lesson progress not found", async () => {
      jest
        .spyOn(lessonProgressService, "updateLessonProgress")
        .mockRejectedValue(new NotFoundException("Lesson progress not found"));

      await expect(
        service.updateLessonProgress("enrollment-123", "invalid-lesson", {
          videoProgress: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getProgressSummary", () => {
    const mockSummary = {
      enrollmentId: "enrollment-123",
      ecCode: "EC0249",
      ecTitle: "Diseño de cursos de capacitación",
      overallProgress: 50,
      modulesCompleted: 0,
      modulesTotal: 1,
      lessonsCompleted: 1,
      lessonsTotal: 2,
      documentsApproved: 0,
      documentsTotal: 0,
      assessmentsPassed: 0,
      assessmentsTotal: 0,
      certificationReady: false,
      estimatedHoursRemaining: 20,
    };

    it("should return comprehensive progress summary", async () => {
      jest
        .spyOn(progressCalculationService, "getProgressSummary")
        .mockResolvedValue(mockSummary as any);

      const result = await service.getProgressSummary("enrollment-123");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("overallProgress");
      expect(result).toHaveProperty("modulesCompleted");
      expect(result).toHaveProperty("lessonsCompleted");
      expect(result).toHaveProperty("certificationReady");
      expect(result.ecCode).toBe("EC0249");
    });

    it("should throw NotFoundException for invalid enrollment", async () => {
      jest
        .spyOn(progressCalculationService, "getProgressSummary")
        .mockRejectedValue(new NotFoundException("Enrollment not found"));

      await expect(service.getProgressSummary("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("withdrawEnrollment", () => {
    it("should withdraw enrollment successfully", async () => {
      jest
        .spyOn(enrollmentManagementService, "withdrawEnrollment")
        .mockResolvedValue({ message: "Enrollment withdrawn successfully" });

      const result = await service.withdrawEnrollment("enrollment-123");

      expect(result).toBeDefined();
      expect(result.message).toBe("Enrollment withdrawn successfully");
      expect(
        enrollmentManagementService.withdrawEnrollment,
      ).toHaveBeenCalledWith("enrollment-123");
    });

    it("should throw NotFoundException when enrollment not found", async () => {
      jest
        .spyOn(enrollmentManagementService, "withdrawEnrollment")
        .mockRejectedValue(new NotFoundException("Enrollment not found"));

      await expect(service.withdrawEnrollment("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when enrollment is certified", async () => {
      jest
        .spyOn(enrollmentManagementService, "withdrawEnrollment")
        .mockRejectedValue(
          new BadRequestException("Cannot withdraw a certified enrollment"),
        );

      await expect(
        service.withdrawEnrollment("enrollment-123"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("resetEnrollmentProgress", () => {
    it("should reset all progress successfully", async () => {
      jest
        .spyOn(enrollmentManagementService, "resetEnrollmentProgress")
        .mockResolvedValue({ message: "Progress reset successfully" });

      const result = await service.resetEnrollmentProgress("enrollment-123");

      expect(result).toBeDefined();
      expect(result.message).toBe("Progress reset successfully");
      expect(
        enrollmentManagementService.resetEnrollmentProgress,
      ).toHaveBeenCalledWith("enrollment-123");
    });

    it("should throw BadRequestException when enrollment is certified", async () => {
      jest
        .spyOn(enrollmentManagementService, "resetEnrollmentProgress")
        .mockRejectedValue(
          new BadRequestException(
            "Cannot reset progress for a certified enrollment",
          ),
        );

      await expect(
        service.resetEnrollmentProgress("enrollment-123"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getECLeaderboard", () => {
    it("should return leaderboard data", async () => {
      const mockLeaderboard = [
        {
          rank: 1,
          userId: "user-123",
          displayName: "Test User",
          progress: 100,
          modulesCompleted: 5,
        },
      ];
      jest
        .spyOn(enrollmentAnalyticsService, "getECLeaderboard")
        .mockResolvedValue(mockLeaderboard as any);

      const result = await service.getECLeaderboard("EC0249", "tenant-123", 10);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(enrollmentAnalyticsService.getECLeaderboard).toHaveBeenCalledWith(
        "EC0249",
        "tenant-123",
        10,
      );
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent activity data", async () => {
      const mockActivity = [
        {
          type: "lesson",
          title: "Lesson 1",
          code: "LES001",
          status: "COMPLETED",
          timestamp: new Date(),
        },
      ];
      jest
        .spyOn(enrollmentAnalyticsService, "getRecentActivity")
        .mockResolvedValue(mockActivity as any);

      const result = await service.getRecentActivity("enrollment-123", 20);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(enrollmentAnalyticsService.getRecentActivity).toHaveBeenCalledWith(
        "enrollment-123",
        20,
      );
    });
  });
});

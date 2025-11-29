import { Test, TestingModule } from "@nestjs/testing";
import { EnrollmentsController } from "./enrollments.controller";
import { EnrollmentsService } from "./enrollments.service";
import { ProgressService } from "./progress.service";
import { AuthenticatedRequest } from "../../common/interfaces";

describe("EnrollmentsController", () => {
  let controller: EnrollmentsController;
  let enrollmentsService: jest.Mocked<EnrollmentsService>;
  let progressService: jest.Mocked<ProgressService>;

  const mockEnrollmentsService = {
    enroll: jest.fn(),
    getMyCourses: jest.fn(),
    getEnrollmentProgress: jest.fn(),
    unenroll: jest.fn(),
  };

  const mockProgressService = {
    markLessonInProgress: jest.fn(),
    markLessonComplete: jest.fn(),
    resetLessonProgress: jest.fn(),
    getLessonProgress: jest.fn(),
    getNextLesson: jest.fn(),
  };

  const mockReq = {
    user: { tenantId: "tenant-1", id: "user-1" },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    enrollmentsService = module.get(EnrollmentsService);
    progressService = module.get(ProgressService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("enrollInCourse", () => {
    it("should enroll user in course", async () => {
      enrollmentsService.enroll.mockResolvedValue({} as any);
      await controller.enrollInCourse(mockReq, { courseId: "course-1" });
      expect(enrollmentsService.enroll).toHaveBeenCalledWith(
        "tenant-1",
        "user-1",
        "course-1",
      );
    });
  });

  describe("getMyCourses", () => {
    it("should get enrolled courses", async () => {
      enrollmentsService.getMyCourses.mockResolvedValue([]);
      await controller.getMyCourses(mockReq);
      expect(enrollmentsService.getMyCourses).toHaveBeenCalledWith(
        "tenant-1",
        "user-1",
      );
    });
  });

  describe("getEnrollmentProgress", () => {
    it("should get enrollment progress", async () => {
      enrollmentsService.getEnrollmentProgress.mockResolvedValue({} as any);
      await controller.getEnrollmentProgress(mockReq, "enroll-1");
      expect(enrollmentsService.getEnrollmentProgress).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
    });
  });

  describe("unenroll", () => {
    it("should unenroll from course", async () => {
      enrollmentsService.unenroll.mockResolvedValue({} as any);
      await controller.unenroll(mockReq, "enroll-1");
      expect(enrollmentsService.unenroll).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
    });
  });

  describe("startLesson", () => {
    it("should mark lesson as in progress", async () => {
      progressService.markLessonInProgress.mockResolvedValue({} as any);
      await controller.startLesson(mockReq, "enroll-1", "lesson-1");
      expect(progressService.markLessonInProgress).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
        "lesson-1",
      );
    });
  });

  describe("completeLesson", () => {
    it("should mark lesson as complete", async () => {
      progressService.markLessonComplete.mockResolvedValue({} as any);
      await controller.completeLesson(mockReq, "enroll-1", "lesson-1");
      expect(progressService.markLessonComplete).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
        "lesson-1",
      );
    });
  });

  describe("resetLesson", () => {
    it("should reset lesson progress", async () => {
      progressService.resetLessonProgress.mockResolvedValue({} as any);
      await controller.resetLesson(mockReq, "enroll-1", "lesson-1");
      expect(progressService.resetLessonProgress).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
        "lesson-1",
      );
    });
  });

  describe("getLessonProgress", () => {
    it("should get lesson progress", async () => {
      progressService.getLessonProgress.mockResolvedValue({} as any);
      await controller.getLessonProgress(mockReq, "enroll-1", "lesson-1");
      expect(progressService.getLessonProgress).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
        "lesson-1",
      );
    });
  });

  describe("getNextLesson", () => {
    it("should get next lesson", async () => {
      progressService.getNextLesson.mockResolvedValue({} as any);
      await controller.getNextLesson(mockReq, "enroll-1");
      expect(progressService.getNextLesson).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
    });
  });
});

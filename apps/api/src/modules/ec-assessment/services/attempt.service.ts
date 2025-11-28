import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { GradingService } from "./grading.service";
import { SubmitAttemptDto, SubmitAnswerDto } from "../dto/ec-assessment.dto";
import { Question } from "../handlers";

@Injectable()
export class AttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradingService: GradingService,
  ) {}

  async startAssessmentAttempt(enrollmentId: string, assessmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || assessment.ecId !== enrollment.ecId) {
      throw new BadRequestException(
        "Assessment does not belong to enrolled EC",
      );
    }

    const existingAttempts = await this.prisma.eCAssessmentAttempt.count({
      where: {
        enrollmentId,
        assessmentId,
        status: { not: "IN_PROGRESS" },
      },
    });

    if (existingAttempts >= assessment.allowedAttempts) {
      throw new ForbiddenException(
        `Maximum attempts (${assessment.allowedAttempts}) reached`,
      );
    }

    const inProgress = await this.prisma.eCAssessmentAttempt.findFirst({
      where: {
        enrollmentId,
        assessmentId,
        status: "IN_PROGRESS",
      },
    });

    if (inProgress) {
      return inProgress;
    }

    return this.prisma.eCAssessmentAttempt.create({
      data: {
        enrollmentId,
        assessmentId,
        status: "IN_PROGRESS",
        responses: [],
      },
    });
  }

  async submitAnswer(attemptId: string, dto: SubmitAnswerDto) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    if (attempt.assessment.timeLimit) {
      const elapsed = Math.floor(
        (Date.now() - attempt.startedAt.getTime()) / 1000,
      );
      if (elapsed > attempt.assessment.timeLimit) {
        return this.completeAttempt(attemptId, true);
      }
    }

    const responses = attempt.responses as unknown as Array<{
      questionId: string;
      response: unknown;
      timeSpent?: number;
      answeredAt: Date;
    }>;

    const existingIndex = responses.findIndex(
      (r) => r.questionId === dto.questionId,
    );

    const responseData = {
      questionId: dto.questionId,
      response: dto.response,
      timeSpent: dto.timeSpent,
      answeredAt: new Date(),
    };

    if (existingIndex >= 0) {
      responses[existingIndex] = responseData;
    } else {
      responses.push(responseData);
    }

    await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: { responses: responses as unknown as object[] },
    });

    return { success: true, answeredQuestions: responses.length };
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: {
        responses: dto.answers.map((a) => ({
          questionId: a.questionId,
          response: a.response,
          answeredAt: new Date(),
        })),
        timeSpent: dto.timeSpent,
      },
    });

    return this.completeAttempt(attemptId, false);
  }

  async completeAttempt(attemptId: string, timedOut: boolean) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    const questions = attempt.assessment.questions as unknown as Question[];
    const responses = attempt.responses as unknown as Array<{
      questionId: string;
      response: unknown;
    }>;

    const gradingResult = this.gradingService.gradeAttempt(
      questions,
      responses,
      attempt.assessment.passingScore,
    );

    const timeSpent =
      attempt.timeSpent ||
      Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    const updated = await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: timedOut ? "TIMED_OUT" : "COMPLETED",
        completedAt: new Date(),
        timeSpent,
        score: gradingResult.percentage,
        passed: gradingResult.passed,
        responses: gradingResult.questionResults as unknown as object[],
      },
    });

    return {
      attemptId,
      assessmentId: attempt.assessmentId,
      status: updated.status,
      score: gradingResult.totalPoints,
      maxScore: gradingResult.maxPoints,
      percentage: gradingResult.percentage,
      passed: gradingResult.passed,
      timeSpent,
      questionResults: attempt.assessment.showResults
        ? gradingResult.questionResults
        : undefined,
      completedAt: updated.completedAt,
    };
  }

  async getAttemptById(attemptId: string) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            ec: {
              select: { code: true, title: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    return attempt;
  }
}

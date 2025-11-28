import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementEngineService } from './achievement-engine.service';
import { StreakService } from './streak.service';
import { GamificationService } from './gamification.service';

/**
 * Event payload interfaces
 */
interface VideoWatchedEvent {
  userId: string;
  tenantId: string;
  videoId: string;
  duration: number;
  completed: boolean;
}

interface LessonCompletedEvent {
  userId: string;
  tenantId: string;
  lessonId: string;
  moduleId: string;
  courseId: string;
}

interface ModuleCompletedEvent {
  userId: string;
  tenantId: string;
  moduleId: string;
  courseId: string;
}

interface QuizCompletedEvent {
  userId: string;
  tenantId: string;
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
}

interface CourseCompletedEvent {
  userId: string;
  tenantId: string;
  courseId: string;
  enrollmentId: string;
}

interface CertificateEarnedEvent {
  userId: string;
  tenantId: string;
  certificateId: string;
  courseId: string;
}

interface DocumentGeneratedEvent {
  userId: string;
  tenantId: string;
  documentType: string;
  documentId: string;
}

interface UserLoginEvent {
  userId: string;
  tenantId: string;
}

/**
 * Gamification Event Listener
 * Handles events from other modules to trigger gamification updates
 */
@Injectable()
export class GamificationEventsListener {
  private readonly logger = new Logger(GamificationEventsListener.name);

  constructor(
    private readonly achievementEngine: AchievementEngineService,
    private readonly streakService: StreakService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Handle video watched events
   */
  @OnEvent('video.watched')
  async handleVideoWatched(event: VideoWatchedEvent): Promise<void> {
    this.logger.debug(`Video watched event: ${JSON.stringify(event)}`);

    try {
      // Record activity
      await this.streakService.recordActivity(event.userId, event.tenantId, 'video', 5);

      // Check achievements if video was completed
      if (event.completed) {
        const unlocked = await this.achievementEngine.onVideoWatched(event.userId, event.tenantId);
        if (unlocked.length > 0) {
          this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling video.watched event: ${error}`);
    }
  }

  /**
   * Handle lesson completed events
   */
  @OnEvent('lesson.completed')
  async handleLessonCompleted(event: LessonCompletedEvent): Promise<void> {
    this.logger.debug(`Lesson completed event: ${JSON.stringify(event)}`);

    try {
      // Record activity and award points
      await this.streakService.recordActivity(event.userId, event.tenantId, 'lesson', 15);
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        15,
        `Completed lesson`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onLessonCompleted(event.userId, event.tenantId);
      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling lesson.completed event: ${error}`);
    }
  }

  /**
   * Handle module completed events
   */
  @OnEvent('module.completed')
  async handleModuleCompleted(event: ModuleCompletedEvent): Promise<void> {
    this.logger.debug(`Module completed event: ${JSON.stringify(event)}`);

    try {
      // Record activity and award points
      await this.streakService.recordActivity(event.userId, event.tenantId, 'module', 50);
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        50,
        `Completed module`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onModuleCompleted(event.userId, event.tenantId);
      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling module.completed event: ${error}`);
    }
  }

  /**
   * Handle quiz completed events
   */
  @OnEvent('quiz.completed')
  async handleQuizCompleted(event: QuizCompletedEvent): Promise<void> {
    this.logger.debug(`Quiz completed event: ${JSON.stringify(event)}`);

    try {
      // Calculate points based on score
      const scorePercentage = (event.score / event.maxScore) * 100;
      let points = 20; // Base points

      if (scorePercentage === 100) {
        points = 50; // Perfect score bonus
      } else if (scorePercentage >= 90) {
        points = 40;
      } else if (scorePercentage >= 80) {
        points = 30;
      }

      // Record activity and award points
      await this.streakService.recordActivity(event.userId, event.tenantId, 'quiz', points);
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        points,
        `Completed quiz with ${scorePercentage.toFixed(0)}% score`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onQuizCompleted(
        event.userId,
        event.tenantId,
        event.score,
        event.maxScore,
      );

      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling quiz.completed event: ${error}`);
    }
  }

  /**
   * Handle course completed events
   */
  @OnEvent('course.completed')
  async handleCourseCompleted(event: CourseCompletedEvent): Promise<void> {
    this.logger.debug(`Course completed event: ${JSON.stringify(event)}`);

    try {
      // Award significant points for course completion
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        200,
        `Completed course`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onCourseCompleted(
        event.userId,
        event.tenantId,
      );

      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling course.completed event: ${error}`);
    }
  }

  /**
   * Handle certificate earned events
   */
  @OnEvent('certificate.earned')
  async handleCertificateEarned(event: CertificateEarnedEvent): Promise<void> {
    this.logger.debug(`Certificate earned event: ${JSON.stringify(event)}`);

    try {
      // Award points for certificate
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        100,
        `Earned certificate`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onCertificateEarned(
        event.userId,
        event.tenantId,
      );

      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling certificate.earned event: ${error}`);
    }
  }

  /**
   * Handle document generated events
   */
  @OnEvent('document.generated')
  async handleDocumentGenerated(event: DocumentGeneratedEvent): Promise<void> {
    this.logger.debug(`Document generated event: ${JSON.stringify(event)}`);

    try {
      // Award points for document generation
      await this.gamificationService.awardPoints(
        event.userId,
        event.tenantId,
        10,
        `Generated ${event.documentType} document`,
      );

      // Check achievements
      const unlocked = await this.achievementEngine.onDocumentGenerated(
        event.userId,
        event.tenantId,
      );

      if (unlocked.length > 0) {
        this.logger.log(`User ${event.userId} unlocked achievements: ${unlocked.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error handling document.generated event: ${error}`);
    }
  }

  /**
   * Handle user login events
   */
  @OnEvent('user.login')
  async handleUserLogin(event: UserLoginEvent): Promise<void> {
    this.logger.debug(`User login event: ${JSON.stringify(event)}`);

    try {
      // Record daily activity
      const streakResult = await this.streakService.recordActivity(
        event.userId,
        event.tenantId,
        'login',
        1,
      );

      // Check streak achievements if streak was extended
      if (streakResult.streakExtended) {
        const unlocked = await this.achievementEngine.onStreakUpdated(
          event.userId,
          event.tenantId,
        );

        if (unlocked.length > 0) {
          this.logger.log(`User ${event.userId} unlocked streak achievements: ${unlocked.join(', ')}`);
        }
      }

      // Log if streak was broken
      if (streakResult.streakBroken) {
        this.logger.log(`User ${event.userId} lost their streak`);
      }
    } catch (error) {
      this.logger.error(`Error handling user.login event: ${error}`);
    }
  }
}

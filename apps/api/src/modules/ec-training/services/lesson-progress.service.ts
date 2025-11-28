import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, ProgressStatus } from '@avala/db';
import {
  UpdateLessonProgressDto,
  UpdateModuleProgressDto,
  VideoProgressDto,
} from '../dto/ec-enrollment.dto';
import { ProgressCalculationService } from './progress-calculation.service';

@Injectable()
export class LessonProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressCalculation: ProgressCalculationService,
  ) {}

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const progress = await this.prisma.eCLessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Lesson progress not found');
    }

    const updateData = this.buildLessonUpdateData(dto, progress);

    const updated = await this.prisma.eCLessonProgress.update({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      data: updateData,
    });

    await this.progressCalculation.recalculateProgress(enrollmentId);

    return updated;
  }

  private buildLessonUpdateData(
    dto: UpdateLessonProgressDto,
    currentProgress: { startedAt: Date | null; status: string },
  ): Prisma.ECLessonProgressUpdateInput {
    const updateData: Prisma.ECLessonProgressUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as ProgressStatus;
      if (dto.status === 'IN_PROGRESS' && !currentProgress.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (dto.videoProgress !== undefined) {
      updateData.videoProgress = dto.videoProgress;
      if (dto.videoProgress > 0 && !currentProgress.startedAt) {
        updateData.startedAt = new Date();
        updateData.status = 'IN_PROGRESS';
      }
      if (dto.videoProgress >= 90 && currentProgress.status !== 'COMPLETED') {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }
    }

    if (dto.markCompleted) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
      updateData.videoProgress = 100;
    }

    return updateData;
  }

  async trackVideoProgress(
    enrollmentId: string,
    lessonId: string,
    dto: VideoProgressDto,
  ) {
    return this.updateLessonProgress(enrollmentId, lessonId, {
      videoProgress: dto.progress,
    });
  }

  async completeLesson(enrollmentId: string, lessonId: string) {
    return this.updateLessonProgress(enrollmentId, lessonId, {
      markCompleted: true,
    });
  }

  async updateModuleProgress(
    enrollmentId: string,
    moduleId: string,
    dto: UpdateModuleProgressDto,
  ) {
    const progress = await this.prisma.eCModuleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId,
          moduleId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Module progress not found');
    }

    const updateData = this.buildModuleUpdateData(dto, progress);

    return this.prisma.eCModuleProgress.update({
      where: {
        enrollmentId_moduleId: {
          enrollmentId,
          moduleId,
        },
      },
      data: updateData,
    });
  }

  private buildModuleUpdateData(
    dto: UpdateModuleProgressDto,
    currentProgress: { startedAt: Date | null },
  ): Prisma.ECModuleProgressUpdateInput {
    const updateData: Prisma.ECModuleProgressUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as ProgressStatus;
      if (dto.status === 'IN_PROGRESS' && !currentProgress.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }

    if (dto.progress !== undefined) {
      updateData.progress = dto.progress;
    }

    return updateData;
  }

  async startModule(enrollmentId: string, moduleId: string) {
    return this.updateModuleProgress(enrollmentId, moduleId, {
      status: 'IN_PROGRESS',
    });
  }
}

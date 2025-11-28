import { Test, TestingModule } from '@nestjs/testing';
import { StreakService } from './streak.service';
import { PrismaService } from '../../database/prisma.service';

describe('StreakService', () => {
  let service: StreakService;

  const mockUserId = 'user-123';
  const mockTenantId = 'tenant-123';

  const mockStats = {
    userId: mockUserId,
    tenantId: mockTenantId,
    currentStreak: 5,
    longestStreak: 10,
    lastActivityDate: new Date(),
    totalPoints: 500,
    level: 3,
    stats: {},
  };

  const mockPrismaService = {
    userGamificationStats: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dailyActivity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreakInfo', () => {
    it('should return streak info for user with stats', async () => {
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(mockStats);
      mockPrismaService.dailyActivity.findFirst.mockResolvedValue({ id: 'activity-1' });

      const result = await service.getStreakInfo(mockUserId);

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.isActiveToday).toBe(true);
    });

    it('should return default values for user without stats', async () => {
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(null);

      const result = await service.getStreakInfo(mockUserId);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastActivityDate).toBeNull();
      expect(result.isActiveToday).toBe(false);
    });

    it('should detect streak at risk', async () => {
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(mockStats);
      mockPrismaService.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // not active today
        .mockResolvedValueOnce(null); // not active yesterday

      const result = await service.getStreakInfo(mockUserId);

      expect(result.streakAtRisk).toBe(true);
    });
  });

  describe('recordActivity', () => {
    it('should create stats for new user', async () => {
      mockPrismaService.dailyActivity.findFirst.mockResolvedValue(null);
      mockPrismaService.dailyActivity.create.mockResolvedValue({ id: 'activity-1' });
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(null);
      mockPrismaService.userGamificationStats.create.mockResolvedValue({
        ...mockStats,
        currentStreak: 1,
      });

      const result = await service.recordActivity(mockUserId, mockTenantId, 'lesson', 10);

      expect(result.newStreak).toBe(1);
      expect(result.streakExtended).toBe(true);
    });

    it('should extend streak when active yesterday', async () => {
      mockPrismaService.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // today - will be created
        .mockResolvedValueOnce({ id: 'yesterday-activity' }); // yesterday
      mockPrismaService.dailyActivity.create.mockResolvedValue({ id: 'activity-1' });
      mockPrismaService.dailyActivity.count.mockResolvedValue(0);
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(mockStats);
      mockPrismaService.userGamificationStats.update.mockResolvedValue({
        ...mockStats,
        currentStreak: 6,
      });

      const result = await service.recordActivity(mockUserId, mockTenantId, 'lesson', 10);

      expect(result.newStreak).toBe(6);
      expect(result.streakExtended).toBe(true);
    });

    it('should break streak when not active yesterday', async () => {
      const oldStats = {
        ...mockStats,
        lastActivityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      };
      mockPrismaService.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // today
        .mockResolvedValueOnce(null); // yesterday
      mockPrismaService.dailyActivity.create.mockResolvedValue({ id: 'activity-1' });
      mockPrismaService.dailyActivity.count.mockResolvedValue(0);
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(oldStats);
      mockPrismaService.userGamificationStats.update.mockResolvedValue({
        ...oldStats,
        currentStreak: 1,
      });

      const result = await service.recordActivity(mockUserId, mockTenantId, 'lesson', 10);

      expect(result.newStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
    });

    it('should not extend streak for multiple activities same day', async () => {
      mockPrismaService.dailyActivity.findFirst.mockResolvedValue({ id: 'existing' });
      mockPrismaService.dailyActivity.update.mockResolvedValue({ id: 'existing' });
      mockPrismaService.dailyActivity.count.mockResolvedValue(1); // Already active today
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(mockStats);

      const result = await service.recordActivity(mockUserId, mockTenantId, 'quiz', 20);

      expect(result.newStreak).toBe(5); // Unchanged
      expect(result.streakExtended).toBe(false);
    });
  });

  describe('getActivityHistory', () => {
    it('should return activity history for date range', async () => {
      const mockActivities = [
        {
          activityDate: new Date('2024-01-01'),
          pointsEarned: 100,
          activities: { video: 2, lesson: 1, quiz: 1 },
        },
      ];
      mockPrismaService.dailyActivity.findMany.mockResolvedValue(mockActivities);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service.getActivityHistory(mockUserId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].videosWatched).toBe(2);
      expect(result[0].lessonsCompleted).toBe(1);
      expect(result[0].pointsEarned).toBe(100);
    });
  });

  describe('getActivityCalendar', () => {
    it('should return calendar data for year', async () => {
      const mockActivities = [
        {
          activityDate: new Date('2024-06-15'),
          activities: { video: 3, lesson: 2 },
        },
      ];
      mockPrismaService.dailyActivity.findMany.mockResolvedValue(mockActivities);

      const result = await service.getActivityCalendar(mockUserId, 2024);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(5);
      expect(result[0].level).toBe(3); // 5 actions = level 3
    });

    it('should calculate activity levels correctly', async () => {
      const mockActivities = [
        { activityDate: new Date('2024-01-01'), activities: { video: 1 } },
        { activityDate: new Date('2024-01-02'), activities: { video: 3 } },
        { activityDate: new Date('2024-01-03'), activities: { video: 10 } },
      ];
      mockPrismaService.dailyActivity.findMany.mockResolvedValue(mockActivities);

      const result = await service.getActivityCalendar(mockUserId, 2024);

      expect(result[0].level).toBe(1); // 1 action
      expect(result[1].level).toBe(2); // 3 actions
      expect(result[2].level).toBe(4); // 10 actions
    });
  });

  describe('getUsersAtRiskOfLosingStreak', () => {
    it('should return users with streaks who have not been active today', async () => {
      mockPrismaService.userGamificationStats.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      mockPrismaService.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // user-1 not active
        .mockResolvedValueOnce({ id: 'activity' }); // user-2 active

      const result = await service.getUsersAtRiskOfLosingStreak(mockTenantId);

      expect(result).toContain('user-1');
      expect(result).not.toContain('user-2');
    });
  });

  describe('resetBrokenStreaks', () => {
    it('should reset streaks for inactive users', async () => {
      mockPrismaService.userGamificationStats.findMany.mockResolvedValue([
        { userId: 'user-1', currentStreak: 5 },
      ]);
      mockPrismaService.userGamificationStats.update.mockResolvedValue({});

      await service.resetBrokenStreaks();

      expect(mockPrismaService.userGamificationStats.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { currentStreak: 0 },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../../database/prisma.service';
import { LeaderboardType } from '@avala/db';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockUser = {
    id: mockUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockStats = {
    userId: mockUserId,
    tenantId: mockTenantId,
    totalPoints: 1000,
    level: 5,
    currentStreak: 10,
    longestStreak: 15,
  };

  const mockPrismaService = {
    dailyActivity: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    userGamificationStats: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userAchievement: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    beforeEach(() => {
      mockPrismaService.userGamificationStats.findMany.mockResolvedValue([mockStats]);
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(mockStats);
      mockPrismaService.userGamificationStats.count.mockResolvedValue(10);
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userAchievement.groupBy.mockResolvedValue([
        { userId: mockUserId, _count: 5 },
      ]);
    });

    it('should return global points leaderboard', async () => {
      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.GLOBAL_POINTS,
        10,
        mockUserId,
      );

      expect(result.type).toBe(LeaderboardType.GLOBAL_POINTS);
      expect(result.period).toBe('All Time');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].userId).toBe(mockUserId);
      expect(result.entries[0].points).toBe(1000);
      expect(result.userRank).toBeDefined();
    });

    it('should return streak leaderboard', async () => {
      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.STREAK_LENGTH,
        10,
      );

      expect(result.type).toBe(LeaderboardType.STREAK_LENGTH);
      expect(result.period).toBe('Current Streaks');
      expect(result.entries[0].streak).toBe(10);
    });

    it('should return weekly points leaderboard', async () => {
      mockPrismaService.dailyActivity.groupBy
        .mockResolvedValueOnce([{ userId: mockUserId, _sum: { pointsEarned: 200 } }])
        .mockResolvedValueOnce([{ userId: mockUserId }]);

      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.WEEKLY_POINTS,
        10,
      );

      expect(result.type).toBe(LeaderboardType.WEEKLY_POINTS);
      expect(result.period).toBe('This Week');
    });

    it('should return monthly points leaderboard', async () => {
      mockPrismaService.dailyActivity.groupBy
        .mockResolvedValueOnce([{ userId: mockUserId, _sum: { pointsEarned: 500 } }])
        .mockResolvedValueOnce([{ userId: mockUserId }]);

      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.MONTHLY_POINTS,
        10,
      );

      expect(result.type).toBe(LeaderboardType.MONTHLY_POINTS);
      expect(result.period).toBe('This Month');
    });

    it('should include user rank when userId provided', async () => {
      mockPrismaService.dailyActivity.aggregate.mockResolvedValue({
        _sum: { pointsEarned: 150 },
      });
      mockPrismaService.dailyActivity.groupBy.mockResolvedValue([]);

      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.GLOBAL_POINTS,
        10,
        mockUserId,
      );

      expect(result.userRank).toBeDefined();
      expect(result.userRank?.userId).toBe(mockUserId);
    });

    it('should handle user without stats', async () => {
      mockPrismaService.userGamificationStats.findUnique.mockResolvedValue(null);

      const result = await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.GLOBAL_POINTS,
        10,
        'unknown-user',
      );

      expect(result.userRank).toBeUndefined();
    });
  });

  describe('cacheLeaderboards', () => {
    it('should execute without error', async () => {
      await expect(service.cacheLeaderboards()).resolves.not.toThrow();
    });
  });
});

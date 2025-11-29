import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementsGrid } from './achievements-grid';

describe('AchievementsGrid', () => {
  const mockAchievements = [
    {
      id: '1',
      code: 'FIRST_LOGIN',
      title: 'First Login',
      description: 'Logged in for the first time',
      category: 'first_steps',
      rarity: 'common' as const,
      icon: 'star',
      points: 10,
      unlocked: true,
      unlockedAt: new Date(),
    },
    {
      id: '2',
      code: 'STREAK_7',
      title: '7 Day Streak',
      description: 'Maintained 7 day streak',
      category: 'streaks',
      rarity: 'rare' as const,
      icon: 'flame',
      points: 50,
      unlocked: false,
    },
  ];

  it('renders achievements', () => {
    render(<AchievementsGrid achievements={mockAchievements} />);
    expect(screen.getByText('First Login')).toBeInTheDocument();
  });

  it('shows locked achievements when showLocked is true', () => {
    render(<AchievementsGrid achievements={mockAchievements} showLocked={true} />);
    expect(screen.getByText('7 Day Streak')).toBeInTheDocument();
  });

  it('hides locked achievements when showLocked is false', () => {
    render(<AchievementsGrid achievements={mockAchievements} showLocked={false} />);
    expect(screen.getByText('First Login')).toBeInTheDocument();
    expect(screen.queryByText('7 Day Streak')).not.toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<AchievementsGrid achievements={mockAchievements} compact={true} />);
    expect(screen.getByText('First Login')).toBeInTheDocument();
  });

  it('displays achievement descriptions', () => {
    render(<AchievementsGrid achievements={mockAchievements} />);
    expect(screen.getByText('Logged in for the first time')).toBeInTheDocument();
  });

  it('renders with empty achievements array', () => {
    const { container } = render(<AchievementsGrid achievements={[]} />);
    expect(container).toBeInTheDocument();
  });
});

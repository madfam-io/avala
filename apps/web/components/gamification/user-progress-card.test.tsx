import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserProgressCard } from './user-progress-card';

const defaultProps = {
  totalPoints: 2500,
  level: 5,
  pointsToNextLevel: 300,
  currentStreak: 7,
  longestStreak: 15,
  achievementsUnlocked: 8,
  totalAchievements: 20,
};

describe('UserProgressCard', () => {
  it('renders card with title', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('Tu Progreso')).toBeInTheDocument();
  });

  it('displays current level', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('Nivel 5')).toBeInTheDocument();
  });

  it('displays total points', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('2,500 puntos')).toBeInTheDocument();
  });

  it('displays points to next level', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('300 para nivel 6')).toBeInTheDocument();
  });

  it('displays max level message when pointsToNextLevel is 0', () => {
    render(<UserProgressCard {...defaultProps} pointsToNextLevel={0} />);
    expect(screen.getByText('Nivel máximo')).toBeInTheDocument();
  });

  it('displays current streak', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Racha actual')).toBeInTheDocument();
  });

  it('displays longest streak', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Mejor racha')).toBeInTheDocument();
  });

  it('displays achievements progress', () => {
    render(<UserProgressCard {...defaultProps} />);
    expect(screen.getByText('Logros desbloqueados')).toBeInTheDocument();
    expect(screen.getByText('8/20')).toBeInTheDocument();
  });

  it('renders progress bars', () => {
    const { container } = render(<UserProgressCard {...defaultProps} />);
    // Should have progress bars for level and achievements
    const progressBars = container.querySelectorAll('[role="progressbar"], [class*="progress"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles zero streaks', () => {
    render(<UserProgressCard {...defaultProps} currentStreak={0} longestStreak={0} />);
    expect(screen.getByText('Racha actual')).toBeInTheDocument();
    expect(screen.getByText('Mejor racha')).toBeInTheDocument();
  });

  it('handles all achievements unlocked', () => {
    render(<UserProgressCard {...defaultProps} achievementsUnlocked={20} totalAchievements={20} />);
    expect(screen.getByText('20/20')).toBeInTheDocument();
  });

  it('renders trophy icon', () => {
    const { container } = render(<UserProgressCard {...defaultProps} />);
    // Trophy icon should be present (lucide icon)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});

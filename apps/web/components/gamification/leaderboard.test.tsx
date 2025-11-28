import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Leaderboard } from './leaderboard';

const mockEntries = [
  { rank: 1, userId: 'user-1', userName: 'Juan García', points: 5000, level: 10, streak: 15 },
  { rank: 2, userId: 'user-2', userName: 'María López', points: 4500, level: 9, streak: 10 },
  { rank: 3, userId: 'user-3', userName: 'Carlos Ruiz', points: 4000, level: 8, streak: 5 },
  { rank: 4, userId: 'user-4', userName: 'Ana Martín', points: 3500, level: 7, streak: 0 },
];

describe('Leaderboard', () => {
  it('renders leaderboard with title', () => {
    render(<Leaderboard entries={mockEntries} />);
    expect(screen.getByText('Tabla de Líderes')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<Leaderboard entries={mockEntries} title="Top Players" />);
    expect(screen.getByText('Top Players')).toBeInTheDocument();
  });

  it('renders all entries', () => {
    render(<Leaderboard entries={mockEntries} />);
    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('Ana Martín')).toBeInTheDocument();
  });

  it('displays points for each entry', () => {
    render(<Leaderboard entries={mockEntries} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('4,500')).toBeInTheDocument();
  });

  it('displays level for each entry', () => {
    render(<Leaderboard entries={mockEntries} />);
    expect(screen.getByText('Nivel 10')).toBeInTheDocument();
    expect(screen.getByText('Nivel 9')).toBeInTheDocument();
  });

  it('displays streak when greater than 0', () => {
    render(<Leaderboard entries={mockEntries} />);
    expect(screen.getByText('15 días')).toBeInTheDocument();
    expect(screen.getByText('10 días')).toBeInTheDocument();
    // Ana has 0 streak, should not show
    expect(screen.queryAllByText('0 días')).toHaveLength(0);
  });

  it('highlights current user', () => {
    render(<Leaderboard entries={mockEntries} currentUserId="user-2" />);
    // Should show "Tú" badge for current user
    expect(screen.getByText('Tú')).toBeInTheDocument();
  });

  it('shows user rank if not in top entries', () => {
    render(
      <Leaderboard
        entries={mockEntries}
        currentUserId="user-99"
        userRank={{ rank: 50, points: 500, level: 3 }}
      />
    );
    // Should show the separator and current user row
    expect(screen.getByText('•••')).toBeInTheDocument();
  });

  it('does not show separator if current user is in entries', () => {
    render(
      <Leaderboard
        entries={mockEntries}
        currentUserId="user-1"
        userRank={{ rank: 1, points: 5000, level: 10 }}
      />
    );
    expect(screen.queryByText('•••')).not.toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    render(<Leaderboard entries={[mockEntries[0]]} />);
    // Juan García -> JG
    expect(screen.getByText('JG')).toBeInTheDocument();
  });

  it('renders empty leaderboard', () => {
    render(<Leaderboard entries={[]} />);
    expect(screen.getByText('Tabla de Líderes')).toBeInTheDocument();
  });

  it('shows rank numbers for entries after top 3', () => {
    render(<Leaderboard entries={mockEntries} />);
    // Rank 4 should show as number
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

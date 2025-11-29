import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCards } from './stats-cards';

describe('StatsCards', () => {
  const mockStats = {
    overview: {
      ecStandards: { total: 100, active: 85 },
      certifiers: { total: 50, active: 45 },
      centers: { total: 200, active: 180 },
      lastSyncAt: new Date('2024-01-01'),
    },
    trends: {
      weeklyGrowth: { ecStandards: 5, certifiers: 2, centers: 10 },
    },
  };

  it('renders all stat cards', () => {
    render(<StatsCards stats={mockStats} />);

    expect(screen.getByText('Estándares de Competencia')).toBeInTheDocument();
    expect(screen.getByText('Certificadores')).toBeInTheDocument();
    expect(screen.getByText('Centros de Evaluación')).toBeInTheDocument();
  });

  it('displays EC standards count', () => {
    render(<StatsCards stats={mockStats} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('de 100 totales')).toBeInTheDocument();
  });

  it('displays certifiers count', () => {
    render(<StatsCards stats={mockStats} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('de 50 totales')).toBeInTheDocument();
  });

  it('displays centers count', () => {
    render(<StatsCards stats={mockStats} />);
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('de 200 totales')).toBeInTheDocument();
  });

  it('renders icons for each card', () => {
    const { container } = render(<StatsCards stats={mockStats} />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<StatsCards stats={mockStats} className="custom-stats" />);
    expect(container.firstChild).toHaveClass('custom-stats');
  });
});

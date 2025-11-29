import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelBadge } from './level-badge';

describe('LevelBadge', () => {
  it('renders with level', () => {
    render(<LevelBadge level={5} />);
    const badge = screen.getByTitle(/Nivel 5/);
    expect(badge).toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<LevelBadge level={1} size="sm" />);
    const badge = container.querySelector('.h-6');
    expect(badge).toBeInTheDocument();
  });

  it('renders medium size', () => {
    const { container } = render(<LevelBadge level={1} size="md" />);
    const badge = container.querySelector('.h-10');
    expect(badge).toBeInTheDocument();
  });

  it('renders large size', () => {
    const { container } = render(<LevelBadge level={1} size="lg" />);
    const badge = container.querySelector('.h-14');
    expect(badge).toBeInTheDocument();
  });

  it('shows label when showLabel is true', () => {
    render(<LevelBadge level={3} showLabel={true} />);
    expect(screen.getByText('Nivel 3')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<LevelBadge level={3} showLabel={false} />);
    expect(screen.queryByText('Nivel 3')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LevelBadge level={1} className="custom-badge" />);
    expect(container.firstChild).toHaveClass('custom-badge');
  });

  it('handles high level numbers', () => {
    render(<LevelBadge level={10} showLabel={true} />);
    expect(screen.getByText('Nivel 10')).toBeInTheDocument();
  });

  it('renders correct icon for level', () => {
    const { container } = render(<LevelBadge level={1} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

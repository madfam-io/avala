import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders progress bar', () => {
    render(<Progress value={50} data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full');
  });

  it('merges custom className', () => {
    render(<Progress value={50} className="custom-progress" data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('custom-progress');
    expect(progress).toHaveClass('rounded-full');
  });

  it('sets correct transform style for value', () => {
    const { container } = render(<Progress value={75} />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('handles 0% value', () => {
    const { container } = render(<Progress value={0} />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('handles 100% value', () => {
    const { container } = render(<Progress value={100} />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('handles undefined value as 0', () => {
    const { container } = render(<Progress />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Progress ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('supports aria attributes for accessibility', () => {
    render(
      <Progress
        value={50}
        aria-label="Loading progress"
        data-testid="progress"
      />
    );
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('aria-label', 'Loading progress');
  });
});

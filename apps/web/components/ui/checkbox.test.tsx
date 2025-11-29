import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox aria-label="test-checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Checkbox checked aria-label="checked-box" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('handles unchecked state', () => {
    render(<Checkbox checked={false} aria-label="unchecked-box" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onCheckedChange when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox onCheckedChange={handleChange} aria-label="clickable-box" />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders disabled state', () => {
    render(<Checkbox disabled aria-label="disabled-box" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-checkbox" aria-label="custom-box" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-checkbox');
  });
});

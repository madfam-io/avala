import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders correctly', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toBeInTheDocument();
  });

  it('renders horizontal orientation by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('is decorative by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('can be non-decorative', () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom-separator" />);
    expect(container.firstChild).toHaveClass('custom-separator');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders correctly', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with htmlFor attribute', () => {
    render(<Label htmlFor="test-input">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom</Label>);
    const label = screen.getByText('Custom');
    expect(label).toHaveClass('custom-label');
  });

  it('accepts id prop', () => {
    render(<Label id="label-id">Labeled Text</Label>);
    const label = screen.getByText('Labeled Text');
    expect(label).toHaveAttribute('id', 'label-id');
  });
});

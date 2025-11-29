import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText('Enter text');
    expect(textarea).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Type here" />);

    const textarea = screen.getByPlaceholderText('Type here');
    await user.type(textarea, 'Hello World');

    expect(textarea).toHaveValue('Hello World');
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter your message" />);
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Textarea disabled placeholder="Disabled textarea" />);
    const textarea = screen.getByPlaceholderText('Disabled textarea');
    expect(textarea).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="Custom" />);
    const textarea = screen.getByPlaceholderText('Custom');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('handles onChange event', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Textarea onChange={handleChange} placeholder="Test" />);
    const textarea = screen.getByPlaceholderText('Test');

    await user.type(textarea, 'A');
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts rows prop', () => {
    render(<Textarea rows={10} placeholder="Many rows" />);
    const textarea = screen.getByPlaceholderText('Many rows');
    expect(textarea).toHaveAttribute('rows', '10');
  });
});

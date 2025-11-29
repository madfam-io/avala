import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBox } from './search-box';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API
vi.mock('@/lib/api/renec', () => ({
  autocomplete: vi.fn(() => Promise.resolve({ standards: [], certifiers: [], centers: [] })),
  trackSearch: vi.fn(),
}));

describe('SearchBox', () => {
  it('renders with default placeholder', () => {
    render(<SearchBox />);
    expect(screen.getByPlaceholderText(/Buscar estándares/)).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBox placeholder="Custom search" />);
    expect(screen.getByPlaceholderText('Custom search')).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');

    expect(input).toHaveValue('test query');
  });

  it('renders with default value', () => {
    render(<SearchBox defaultValue="initial search" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial search');
  });

  it('shows search icon', () => {
    const { container } = render(<SearchBox />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SearchBox className="custom-search" />);
    expect(container.firstChild).toHaveClass('custom-search');
  });

  it('can disable autocomplete', () => {
    render(<SearchBox showAutocomplete={false} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  const mockPagination = {
    page: 1,
    pageSize: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false,
  };

  it('renders pagination info', () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={mockPagination} onPageChange={onPageChange} />);

    expect(screen.getByText(/Mostrando página 1 de 10/)).toBeInTheDocument();
    expect(screen.getByText(/100 resultados/)).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={mockPagination} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0];
    expect(prevButton).toBeDisabled();
  });

  it('enables next button when hasNext is true', () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={mockPagination} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton).not.toBeDisabled();
  });

  it('disables next button when hasNext is false', () => {
    const onPageChange = vi.fn();
    const lastPagePagination = { ...mockPagination, page: 10, hasNext: false, hasPrev: true };

    render(<Pagination pagination={lastPagePagination} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton).toBeDisabled();
  });

  it('returns null when totalPages is 1', () => {
    const onPageChange = vi.fn();
    const singlePagePagination = { ...mockPagination, totalPages: 1 };

    const { container } = render(<Pagination pagination={singlePagePagination} onPageChange={onPageChange} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination pagination={mockPagination} onPageChange={onPageChange} className="custom-pagination" />
    );

    expect(container.firstChild).toHaveClass('custom-pagination');
  });
});

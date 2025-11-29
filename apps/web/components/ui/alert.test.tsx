import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  it('renders correctly', () => {
    render(<Alert>Alert content</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Alert>Default alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Error alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('renders AlertTitle', () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
      </Alert>
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders AlertDescription', () => {
    render(
      <Alert>
        <AlertDescription>This is an alert message</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('This is an alert message')).toBeInTheDocument();
  });

  it('renders complete alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Alert className="custom-alert">Custom</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });
});

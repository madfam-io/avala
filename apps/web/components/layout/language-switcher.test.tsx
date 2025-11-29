import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from './language-switcher';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'es',
}));

// Mock i18n config
vi.mock('@/i18n/config', () => ({
  locales: ['en', 'es'],
  localeNames: {
    en: 'English',
    es: 'Español',
  },
  localeFlags: {
    en: '🇺🇸',
    es: '🇪🇸',
  },
}));

describe('LanguageSwitcher', () => {
  it('renders language switcher button', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays current locale', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText(/Español/)).toBeInTheDocument();
  });

  it('shows flag for current locale', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('displays all available locales in dropdown', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getAllByText('Español')).toBeTruthy();
  });

  it('shows globe icon', () => {
    const { container } = render(<LanguageSwitcher />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

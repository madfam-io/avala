'use client';

import { Moon, Sun, Monitor, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTheme, type ThemeMode } from '@/lib/themes/theme-provider';

interface ThemeToggleProps {
  /** Show only icon button without dropdown */
  iconOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Theme Toggle Component
 *
 * Provides a dropdown menu to switch between light, dark, and system themes.
 * Also includes a toggle for enabling/disabling holiday themes.
 */
export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const {
    mode,
    setMode,
    activeHoliday,
    holidayThemesEnabled,
    setHolidayThemesEnabled,
    resolvedTheme,
  } = useTheme();

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        className={className}
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      >
        <ThemeIcon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeMenuItem mode="light" currentMode={mode} onSelect={setMode} />
        <ThemeMenuItem mode="dark" currentMode={mode} onSelect={setMode} />
        <ThemeMenuItem mode="system" currentMode={mode} onSelect={setMode} />

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4" />
          Holiday Themes
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={holidayThemesEnabled}
          onCheckedChange={setHolidayThemesEnabled}
        >
          Enable holiday themes
        </DropdownMenuCheckboxItem>

        {activeHoliday && holidayThemesEnabled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {activeHoliday.emoji} {activeHoliday.nameEs}
            </DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ThemeMenuItemProps {
  mode: ThemeMode;
  currentMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

function ThemeMenuItem({ mode, currentMode, onSelect }: ThemeMenuItemProps) {
  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  const Icon = icons[mode];
  const isSelected = currentMode === mode;

  return (
    <DropdownMenuItem
      onClick={() => onSelect(mode)}
      className={isSelected ? 'bg-accent' : ''}
    >
      <Icon className="mr-2 h-4 w-4" />
      {labels[mode]}
    </DropdownMenuItem>
  );
}

/**
 * Holiday Banner Component
 *
 * Displays a banner when a holiday theme is active.
 * Can be placed at the top of the page or in navigation.
 */
export function HolidayBanner({ className }: { className?: string }) {
  const { activeHoliday, holidayThemesEnabled } = useTheme();

  if (!activeHoliday || !holidayThemesEnabled) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 py-1 px-4 text-sm bg-primary/10 text-primary ${className}`}
    >
      <span>{activeHoliday.emoji}</span>
      <span>{activeHoliday.nameEs}</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">{activeHoliday.name}</span>
    </div>
  );
}

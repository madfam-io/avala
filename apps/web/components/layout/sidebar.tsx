'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getNavigationForRole, type NavItem } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { TenantSwitcher } from './tenant-switcher';

/**
 * Sidebar Component
 * The Body - Adapts navigation based on user role
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();

  if (!user) {
    return null;
  }

  const navigation = getNavigationForRole(user.role);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Header with Tenant Switcher */}
      <div className="p-6 space-y-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">
              A
            </span>
          </div>
          <span className="font-semibold text-lg">AVALA</span>
        </Link>

        {/* Tenant Switcher */}
        <TenantSwitcher />
      </div>

      <Separator />

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <Separator />

      {/* User Info & Logout */}
      <div className="p-4 space-y-2">
        <div className="text-sm">
          <p className="font-medium truncate">{user.email}</p>
          <p className="text-muted-foreground capitalize">
            {user.role.toLowerCase().replace('_', ' ')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Individual navigation link component
 */
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}

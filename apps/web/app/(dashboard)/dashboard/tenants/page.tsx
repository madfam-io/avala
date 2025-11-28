'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

/**
 * Tenants Management Page
 * Admin only - Multi-tenant organization management
 */
export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage organizations and their configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Multi-Tenant Administration
          </CardTitle>
          <CardDescription>
            Create and manage tenant organizations, configure billing, and set up tenant-specific settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature is planned for Phase 2. Tenant management will include:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Create new tenant organizations</li>
            <li>Configure tenant-specific branding</li>
            <li>Manage tenant subscription plans</li>
            <li>View tenant usage analytics</li>
            <li>Tenant data isolation settings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

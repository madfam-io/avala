'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTable } from '@/components/users/users-table';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { UserPlus } from 'lucide-react';

/**
 * Users Management Page
 * Admin-only page for managing organization users
 * Features:
 * - Paginated user list with search and filters
 * - Create new users with CURP/RFC support
 * - Role-based access control
 */
export default function UsersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Users Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all users in your organization. Use the search and
            filters to find specific users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable onCreateUser={() => setIsCreateDialogOpen(true)} />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

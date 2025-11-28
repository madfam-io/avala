'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Palette } from 'lucide-react';

/**
 * Settings Page
 * Account preferences for all users
 */
export default function SettingsPage() {
  const { user, tenant } = useAuth();

  if (!user || !tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user.firstName || ''}
                placeholder="Enter first name"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user.lastName || ''}
                placeholder="Enter last name"
                disabled
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Contact your administrator to change your email address.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={user.role.toLowerCase().replace('_', ' ')}
              disabled
              className="capitalize"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input value={tenant.name} disabled />
          </div>
          <Button disabled>
            Save Changes
          </Button>
          <p className="text-xs text-muted-foreground">
            Profile editing will be available in a future update.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences will be available in a future update. You will be able to:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Enable/disable email notifications</li>
            <li>Configure push notification preferences</li>
            <li>Set notification frequency</li>
            <li>Choose notification types</li>
          </ul>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Security settings will be available in a future update. You will be able to:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Change your password</li>
            <li>Enable two-factor authentication</li>
            <li>View active sessions</li>
            <li>Download your data</li>
          </ul>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Appearance settings will be available in a future update. You will be able to:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Switch between light and dark mode</li>
            <li>Choose accent colors</li>
            <li>Adjust font sizes</li>
            <li>Configure accessibility options</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

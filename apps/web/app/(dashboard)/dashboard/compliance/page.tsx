'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, FileText, ClipboardList, Calendar } from 'lucide-react';

/**
 * Compliance Dashboard Page
 * DC-3, SIRCE exports, and LFT plan management
 */
export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Management</h1>
        <p className="text-muted-foreground mt-2">
          DC-3 records, SIRCE exports, and LFT training plans
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              DC-3 Records
            </CardTitle>
            <CardDescription>
              Constancia de Competencias certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate and manage DC-3 compliance certificates for certified trainees.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" />
              SIRCE Export
            </CardTitle>
            <CardDescription>
              STPS reporting format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Export training data in SIRCE format for STPS regulatory submission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              LFT Plans
            </CardTitle>
            <CardDescription>
              Annual training plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage annual training plans per Ley Federal del Trabajo requirements.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Compliance Overview
          </CardTitle>
          <CardDescription>
            Monitor your organization&apos;s compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full compliance management features are planned for Phase 2. This will include:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Automated DC-3 certificate generation</li>
            <li>SIRCE XML export with validation</li>
            <li>LFT annual plan templates and tracking</li>
            <li>Compliance audit trail and reporting</li>
            <li>Regulatory deadline notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

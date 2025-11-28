'use client';

import { cn } from '@/lib/utils';
import { LeadCaptureBaseProps } from '../types';
import { useLeadCapture } from '../useLeadCapture';
import { LeadForm } from '../LeadForm';

export function InlineLeadCapture({
  context,
  className,
  onSuccess,
}: LeadCaptureBaseProps) {
  const { formData, setFormData, step, isLoading, handleSubmit } =
    useLeadCapture({ context, onSuccess });

  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <LeadForm
        step={step}
        formData={formData}
        setFormData={setFormData}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

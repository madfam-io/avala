'use client';

import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadCaptureBaseProps } from '../types';
import { useLeadCapture } from '../useLeadCapture';
import { LeadForm } from '../LeadForm';

export function ModalLeadCapture({
  context,
  className,
  onSuccess,
}: LeadCaptureBaseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { formData, setFormData, step, isLoading, handleSubmit } =
    useLeadCapture({ context, onSuccess });

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className={className}>
        Comenzar gratis
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <LeadForm
          step={step}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}

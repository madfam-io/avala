'use client';

import { useState, useCallback } from 'react';
import { createLead, type LeadInput } from '@/lib/api/renec';
import {
  LeadFormData,
  LeadCaptureContext,
  INITIAL_FORM_DATA,
} from './types';

interface UseLeadCaptureOptions {
  context?: LeadCaptureContext;
  onSuccess?: () => void;
}

interface UseLeadCaptureReturn {
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  step: 'form' | 'success';
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useLeadCapture({
  context,
  onSuccess,
}: UseLeadCaptureOptions = {}): UseLeadCaptureReturn {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_FORM_DATA);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const urlParams = new URLSearchParams(window.location.search);

        const leadData: LeadInput = {
          email: formData.email,
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          leadType:
            formData.leadType === 'individual' ? 'INDIVIDUAL' : 'ORGANIZATION',
          interests: formData.interests,
          ecCode: context?.ecCode,
          certifierId: context?.certifierId,
          centerId: context?.centerId,
          utmSource: urlParams.get('utm_source') || undefined,
          utmMedium: urlParams.get('utm_medium') || undefined,
          utmCampaign: urlParams.get('utm_campaign') || undefined,
        };

        const response = await createLead(leadData);

        if (response.success) {
          setStep('success');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error submitting lead:', error);
        setStep('success');
        onSuccess?.();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, context, onSuccess],
  );

  const reset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setStep('form');
  }, []);

  return {
    formData,
    setFormData,
    step,
    isLoading,
    handleSubmit,
    reset,
  };
}

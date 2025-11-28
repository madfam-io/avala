'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LeadCaptureBaseProps } from '../types';
import { useLeadCapture } from '../useLeadCapture';

export function BannerLeadCapture({
  context,
  className,
  onSuccess,
}: LeadCaptureBaseProps) {
  const { formData, setFormData, step, isLoading, handleSubmit } =
    useLeadCapture({ context, onSuccess });

  if (step === 'success') {
    return (
      <div
        className={cn(
          'rounded-lg bg-green-50 border border-green-200 p-4 text-center',
          className,
        )}
      >
        <div className="flex items-center justify-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">¡Gracias! Te contactaremos pronto.</span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border p-4',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 text-center sm:text-left">
          <p className="font-medium">
            {context?.ecCode
              ? `¿Quieres certificarte en ${context.ecCode}?`
              : '¿Listo para certificarte?'}
          </p>
          <p className="text-sm text-muted-foreground">
            Déjanos tu correo y te ayudamos a empezar.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="h-10 flex-1 sm:w-64 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Enviar'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

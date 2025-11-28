'use client';

import * as React from 'react';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LeadFormData, Interest, DEFAULT_INTERESTS } from './types';

interface LeadFormProps {
  step: 'form' | 'success';
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onClose?: () => void;
  interests?: Interest[];
}

export function LeadForm({
  step,
  formData,
  setFormData,
  isLoading,
  handleSubmit,
  onClose,
  interests = DEFAULT_INTERESTS,
}: LeadFormProps) {
  if (step === 'success') {
    return <SuccessState onClose={onClose} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormHeader />
      <LeadTypeSelector formData={formData} setFormData={setFormData} />
      <NameField formData={formData} setFormData={setFormData} />
      <EmailField formData={formData} setFormData={setFormData} />
      <PhoneField formData={formData} setFormData={setFormData} />
      {formData.leadType === 'organization' && (
        <CompanyField formData={formData} setFormData={setFormData} />
      )}
      <InterestsField
        formData={formData}
        setFormData={setFormData}
        interests={interests}
      />
      <SubmitButton isLoading={isLoading} />
      <TermsFooter />
    </form>
  );
}

function SuccessState({ onClose }: { onClose?: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold">¡Gracias por tu interés!</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Te enviaremos información a tu correo. Mientras tanto, puedes seguir
        explorando el RENEC.
      </p>
      {onClose && (
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Cerrar
        </Button>
      )}
    </div>
  );
}

function FormHeader() {
  return (
    <div>
      <h3 className="text-lg font-semibold">Comienza tu certificación</h3>
      <p className="text-sm text-muted-foreground">
        Cuéntanos sobre ti y te ayudamos a empezar.
      </p>
    </div>
  );
}

interface FormFieldProps {
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
}

function LeadTypeSelector({ formData, setFormData }: FormFieldProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => setFormData({ ...formData, leadType: 'individual' })}
        className={cn(
          'rounded-lg border p-3 text-sm transition-colors',
          formData.leadType === 'individual'
            ? 'border-primary bg-primary/5'
            : 'hover:bg-accent',
        )}
      >
        <p className="font-medium">Soy individuo</p>
        <p className="text-xs text-muted-foreground">Quiero certificarme</p>
      </button>
      <button
        type="button"
        onClick={() => setFormData({ ...formData, leadType: 'organization' })}
        className={cn(
          'rounded-lg border p-3 text-sm transition-colors',
          formData.leadType === 'organization'
            ? 'border-primary bg-primary/5'
            : 'hover:bg-accent',
        )}
      >
        <p className="font-medium">Soy empresa</p>
        <p className="text-xs text-muted-foreground">Capacitar a mi equipo</p>
      </button>
    </div>
  );
}

function NameField({ formData, setFormData }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium">Nombre completo *</label>
      <input
        type="text"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Tu nombre"
      />
    </div>
  );
}

function EmailField({ formData, setFormData }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium">Email *</label>
      <input
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        placeholder="tu@email.com"
      />
    </div>
  );
}

function PhoneField({ formData, setFormData }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium">Teléfono (opcional)</label>
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        placeholder="55 1234 5678"
      />
    </div>
  );
}

function CompanyField({ formData, setFormData }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium">Empresa *</label>
      <input
        type="text"
        required
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Nombre de tu empresa"
      />
    </div>
  );
}

interface InterestsFieldProps extends FormFieldProps {
  interests: Interest[];
}

function InterestsField({
  formData,
  setFormData,
  interests,
}: InterestsFieldProps) {
  const toggleInterest = (id: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        interests: [...formData.interests, id],
      });
    } else {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== id),
      });
    }
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">¿Qué te interesa?</label>
      <div className="grid grid-cols-2 gap-2">
        {interests.map((interest) => (
          <label
            key={interest.id}
            className={cn(
              'flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer transition-colors',
              formData.interests.includes(interest.id)
                ? 'border-primary bg-primary/5'
                : 'hover:bg-accent',
            )}
          >
            <input
              type="checkbox"
              checked={formData.interests.includes(interest.id)}
              onChange={(e) => toggleInterest(interest.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span>{interest.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          Comenzar ahora
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

function TermsFooter() {
  return (
    <p className="text-xs text-center text-muted-foreground">
      Al enviar, aceptas nuestros{' '}
      <a href="/terms" className="underline hover:text-foreground">
        términos
      </a>{' '}
      y{' '}
      <a href="/privacy" className="underline hover:text-foreground">
        aviso de privacidad
      </a>
      .
    </p>
  );
}

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { InlineLeadCapture } from './InlineLeadCapture';

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">¡Espera!</h3>
          <p className="text-muted-foreground mt-2">
            Antes de irte, ¿te gustaría recibir recursos gratuitos para tu
            certificación?
          </p>
        </div>
        <InlineLeadCapture
          context={{ source: 'exit-intent' }}
          onSuccess={() => {
            setTimeout(() => setIsOpen(false), 2000);
          }}
          className="border-0 p-0"
        />
      </div>
    </div>
  );
}

// Types
export type { LeadFormData, LeadCaptureContext, LeadCaptureBaseProps } from './types';

// Hook
export { useLeadCapture } from './useLeadCapture';

// Core form
export { LeadForm } from './LeadForm';

// Variant components
export { InlineLeadCapture } from './variants/InlineLeadCapture';
export { ModalLeadCapture } from './variants/ModalLeadCapture';
export { BannerLeadCapture } from './variants/BannerLeadCapture';
export { FloatingCTA } from './variants/FloatingCTA';
export { ExitIntentPopup } from './variants/ExitIntentPopup';

// Legacy facade for backwards compatibility
import { InlineLeadCapture } from './variants/InlineLeadCapture';
import { ModalLeadCapture } from './variants/ModalLeadCapture';
import { BannerLeadCapture } from './variants/BannerLeadCapture';
import { LeadCaptureBaseProps } from './types';

interface LeadCaptureProps extends LeadCaptureBaseProps {
  variant?: 'inline' | 'modal' | 'banner';
}

export function LeadCapture({
  variant = 'inline',
  ...props
}: LeadCaptureProps) {
  switch (variant) {
    case 'modal':
      return <ModalLeadCapture {...props} />;
    case 'banner':
      return <BannerLeadCapture {...props} />;
    default:
      return <InlineLeadCapture {...props} />;
  }
}

/**
 * Lead Capture Components - Legacy Entry Point
 *
 * This file provides backwards compatibility. New code should import directly
 * from '@/components/renec/lead-capture' (the directory).
 */

// Types
export type {
  LeadFormData,
  LeadCaptureContext,
  LeadCaptureBaseProps,
} from "./lead-capture/types";

// Hook
export { useLeadCapture } from "./lead-capture/useLeadCapture";

// Core form
export { LeadForm } from "./lead-capture/LeadForm";

// Variant components
export { InlineLeadCapture } from "./lead-capture/variants/InlineLeadCapture";
export { ModalLeadCapture } from "./lead-capture/variants/ModalLeadCapture";
export { BannerLeadCapture } from "./lead-capture/variants/BannerLeadCapture";
export { FloatingCTA } from "./lead-capture/variants/FloatingCTA";
export { ExitIntentPopup } from "./lead-capture/variants/ExitIntentPopup";

// Legacy facade component
import { InlineLeadCapture } from "./lead-capture/variants/InlineLeadCapture";
import { ModalLeadCapture } from "./lead-capture/variants/ModalLeadCapture";
import { BannerLeadCapture } from "./lead-capture/variants/BannerLeadCapture";
import { LeadCaptureBaseProps } from "./lead-capture/types";

interface LeadCaptureProps extends LeadCaptureBaseProps {
  variant?: "inline" | "modal" | "banner";
}

export function LeadCapture({
  variant = "inline",
  ...props
}: LeadCaptureProps) {
  switch (variant) {
    case "modal":
      return <ModalLeadCapture {...props} />;
    case "banner":
      return <BannerLeadCapture {...props} />;
    default:
      return <InlineLeadCapture {...props} />;
  }
}

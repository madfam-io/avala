export type LeadType = 'individual' | 'organization';

export interface LeadFormData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  leadType: LeadType;
  interests: string[];
}

export interface LeadCaptureContext {
  ecCode?: string;
  certifierId?: string;
  centerId?: string;
  source?: string;
}

export interface LeadCaptureBaseProps {
  context?: LeadCaptureContext;
  className?: string;
  onSuccess?: () => void;
}

export interface Interest {
  id: string;
  label: string;
}

export const DEFAULT_INTERESTS: Interest[] = [
  { id: 'certification', label: 'Certificarme en competencias' },
  { id: 'training', label: 'Capacitación para mi equipo' },
  { id: 'dc3', label: 'Gestión de constancias DC-3' },
  { id: 'compliance', label: 'Cumplimiento STPS/LFT' },
];

export const INITIAL_FORM_DATA: LeadFormData = {
  email: '',
  name: '',
  phone: '',
  company: '',
  leadType: 'individual',
  interests: [],
};

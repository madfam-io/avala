'use client';

import { useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  FileText,
  Plus,
  type LucideIcon,
} from 'lucide-react';

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: LucideIcon;
  label: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  APPROVED: {
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Aprobado',
  },
  REJECTED: {
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
    label: 'Rechazado',
  },
  SUBMITTED: {
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    label: 'En revisión',
  },
  DRAFT: {
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: Edit,
    label: 'Borrador',
  },
  IN_PROGRESS: {
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: Edit,
    label: 'Borrador',
  },
  NOT_STARTED: {
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: Plus,
    label: 'Sin iniciar',
  },
};

const DEFAULT_STATUS: StatusConfig = {
  color: 'text-gray-800',
  bgColor: 'bg-gray-100',
  icon: FileText,
  label: 'Desconocido',
};

export function useDocumentStatus(status?: string): StatusConfig {
  return useMemo(() => {
    if (!status) return STATUS_CONFIGS.NOT_STARTED;
    return STATUS_CONFIGS[status] || { ...DEFAULT_STATUS, label: status };
  }, [status]);
}

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIGS[status] || { ...DEFAULT_STATUS, label: status };
}

export function getStatusLabel(status: string): string {
  return STATUS_CONFIGS[status]?.label || status;
}

export function getStatusColor(status: string): string {
  const config = STATUS_CONFIGS[status];
  return config ? `${config.bgColor} ${config.color}` : 'bg-gray-100 text-gray-800';
}

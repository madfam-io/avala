'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Shield, Award, Calendar, Clock, Building } from 'lucide-react';

interface CertificateVerification {
  valid: boolean;
  certificate?: {
    certificateUuid: string;
    folio: string;
    issuedAt: string;
    revokedAt: string | null;
    revokedReason: string | null;
  };
  trainee?: {
    fullName: string;
    curp: string;
  };
  course?: {
    title: string;
    code: string;
    durationHours: number;
    ecCodes: string[];
  };
  tenant?: {
    name: string;
    legalName: string;
  };
}

/**
 * Public Certificate Verification Page
 * Phase 4: Trust Layer (Verification & QR)
 * Features:
 * - Public access (no login required)
 * - QR code landing page
 * - Certificate authenticity verification
 * - Privacy-conscious data display
 */
export default function CertificateVerificationPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uuid) {
      verifyCertificate();
    }
  }, [uuid]);

  const verifyCertificate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/certificates/public/${uuid}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setVerification({ valid: false });
        } else {
          throw new Error('Failed to verify certificate');
        }
        return;
      }

      const data = await response.json();
      setVerification(data);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Verificando certificado...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Error de Verificación</h2>
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid certificate
  if (!verification?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Certificado No Válido</h2>
              <p className="text-sm text-red-700 text-center">
                {verification?.certificate?.revokedAt
                  ? `Este certificado ha sido revocado. Razón: ${verification.certificate.revokedReason || 'No especificada'}`
                  : 'El certificado no fue encontrado o ha expirado.'}
              </p>
              <p className="text-xs text-muted-foreground">
                ID de Verificación: {uuid}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid certificate
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <Shield className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-900">Certificado Válido</h1>
          <p className="text-muted-foreground">
            Constancia de Competencias DC-3 Verificada
          </p>
        </div>

        {/* Verification Badge */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-6">
            <div className="flex items-center justify-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Certificado Emitido por {verification.tenant?.name || 'AVALA LMS'}
                </p>
                <p className="text-sm text-green-700">
                  Folio: {verification.certificate?.folio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trainee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Información del Trabajador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-semibold">{verification.trainee?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CURP</p>
              <p className="font-mono text-sm">{verification.trainee?.curp}</p>
            </div>
          </CardContent>
        </Card>

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Información del Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Curso</p>
              <p className="font-semibold">{verification.course?.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-mono text-sm">{verification.course?.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {verification.course?.durationHours} horas de capacitación
              </span>
            </div>
            {verification.course?.ecCodes && verification.course.ecCodes.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Estándares de Competencia (EC)
                </p>
                <div className="flex flex-wrap gap-2">
                  {verification.course.ecCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issuance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Información de Emisión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
              <p className="font-semibold">
                {verification.certificate?.issuedAt &&
                  formatDate(verification.certificate.issuedAt)}
              </p>
            </div>
            {verification.tenant?.legalName && (
              <div>
                <p className="text-sm text-muted-foreground">Razón Social</p>
                <p className="font-semibold">{verification.tenant.legalName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">
            ID de Verificación: {verification.certificate?.certificateUuid}
          </p>
          <p className="text-xs text-muted-foreground">
            Este certificado ha sido verificado electrónicamente a través del
            sistema AVALA LMS
          </p>
          <p className="text-xs text-muted-foreground">
            Constancia de Competencias conforme al artículo 153-V de la Ley
            Federal del Trabajo
          </p>
        </div>
      </div>
    </div>
  );
}

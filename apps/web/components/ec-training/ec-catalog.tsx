'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  ChevronRight,
  GraduationCap,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import type { ECStandard, ECEnrollment } from '@/lib/api/ec-api';

interface ECCatalogProps {
  standards: ECStandard[];
  enrollments?: ECEnrollment[];
  onEnroll?: (ecCode: string) => void;
  onContinue?: (enrollment: ECEnrollment) => void;
}

export function ECCatalog({
  standards,
  enrollments = [],
  onEnroll,
  onContinue,
}: ECCatalogProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');

  const enrollmentMap = new Map(
    enrollments.map((e) => [e.ec?.code, e])
  );

  const filteredStandards = standards.filter((ec) => {
    const matchesSearch =
      ec.code.toLowerCase().includes(search.toLowerCase()) ||
      ec.title.toLowerCase().includes(search.toLowerCase()) ||
      ec.description.toLowerCase().includes(search.toLowerCase());

    const isEnrolled = enrollmentMap.has(ec.code);

    if (filter === 'enrolled') return matchesSearch && isEnrolled;
    if (filter === 'available') return matchesSearch && !isEnrolled;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estándares de competencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'enrolled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('enrolled')}
          >
            Inscritos
          </Button>
          <Button
            variant={filter === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('available')}
          >
            Disponibles
          </Button>
        </div>
      </div>

      {/* Standards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStandards.map((ec) => {
          const enrollment = enrollmentMap.get(ec.code);

          return (
            <ECStandardCard
              key={ec.id}
              standard={ec}
              enrollment={enrollment}
              onEnroll={onEnroll}
              onContinue={onContinue}
            />
          );
        })}
      </div>

      {filteredStandards.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron estándares</h3>
          <p className="text-muted-foreground">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}

interface ECStandardCardProps {
  standard: ECStandard;
  enrollment?: ECEnrollment;
  onEnroll?: (ecCode: string) => void;
  onContinue?: (enrollment: ECEnrollment) => void;
}

function ECStandardCard({
  standard,
  enrollment,
  onEnroll,
  onContinue,
}: ECStandardCardProps) {
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'COMPLETED' || enrollment?.status === 'CERTIFIED';

  const enrollmentStatusBadge = {
    IN_PROGRESS: { label: 'En Progreso', variant: 'default' as const, color: 'bg-blue-500' },
    COMPLETED: { label: 'Completado', variant: 'secondary' as const, color: 'bg-green-500' },
    CERTIFIED: { label: 'Certificado', variant: 'default' as const, color: 'bg-purple-500' },
    EXPIRED: { label: 'Expirado', variant: 'destructive' as const, color: 'bg-red-500' },
  };

  return (
    <Card className={`relative overflow-hidden transition-shadow hover:shadow-lg ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
      {/* Status indicator */}
      {isEnrolled && enrollment && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${enrollmentStatusBadge[enrollment.status].color}`} />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="mb-2">
              {standard.code}
            </Badge>
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {standard.title}
            </CardTitle>
          </div>
          {isCompleted && (
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {standard.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{standard.estimatedHours}h estimadas</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{standard._count?.modules || 0} módulos</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{standard._count?.templates || 0} documentos</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>Nivel {standard.level}</span>
          </div>
        </div>

        {/* Progress bar for enrolled users */}
        {isEnrolled && enrollment && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{enrollment.overallProgress}%</span>
            </div>
            <Progress value={enrollment.overallProgress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        {isEnrolled ? (
          <Button
            className="w-full"
            onClick={() => enrollment && onContinue?.(enrollment)}
          >
            {isCompleted ? 'Ver certificado' : 'Continuar'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => onEnroll?.(standard.code)}
            disabled={standard.status !== 'PUBLISHED'}
          >
            Inscribirse
            <GraduationCap className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export { ECStandardCard };

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  FolderOpen,
  Award,
} from "lucide-react";
import {
  portfolioApi,
  type ECDocument,
  type DocumentTemplate,
} from "@/lib/api/ec-api";

interface PortfolioStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  completionPercentage: number;
}

interface PortfolioDashboardProps {
  enrollmentId: string;
  ecStandardId: string;
  onCreateDocument?: (template: DocumentTemplate) => void;
  onEditDocument?: (document: ECDocument) => void;
  onViewDocument?: (document: ECDocument) => void;
}

export function PortfolioDashboard({
  enrollmentId,
  ecStandardId,
  onCreateDocument,
  onEditDocument,
  onViewDocument,
}: PortfolioDashboardProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<ECDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats>({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completionPercentage: 0,
  });

  useEffect(() => {
    loadPortfolioData();
  }, [enrollmentId, ecStandardId]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const [templatesData, portfolioSummary] = await Promise.all([
        portfolioApi.getTemplates(ecStandardId),
        portfolioApi.getPortfolioSummary(enrollmentId),
      ]);

      setTemplates(templatesData);
      setDocuments(portfolioSummary.documents || []);

      // Calculate stats
      const docs = portfolioSummary.documents || [];
      setStats({
        total: docs.length,
        draft: docs.filter((d: ECDocument) => d.status === "DRAFT").length,
        pending: docs.filter((d: ECDocument) => d.status === "SUBMITTED")
          .length,
        approved: docs.filter((d: ECDocument) => d.status === "APPROVED")
          .length,
        rejected: docs.filter((d: ECDocument) => d.status === "REJECTED")
          .length,
        completionPercentage:
          portfolioSummary.completionPercentage ||
          portfolioSummary.overallProgress ||
          0,
      });
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentForTemplate = (
    templateId: string,
  ): ECDocument | undefined => {
    return documents.find((doc) => doc.templateId === templateId);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          label: "Aprobado",
        };
      case "REJECTED":
        return {
          color: "bg-red-100 text-red-800",
          icon: AlertCircle,
          label: "Rechazado",
        };
      case "SUBMITTED":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          label: "En revisión",
        };
      case "DRAFT":
      case "IN_PROGRESS":
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Edit,
          label: "Borrador",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: FileText,
          label: status,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Borradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.completionPercentage}%
                </p>
                <p className="text-sm text-muted-foreground">Completado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso del Portafolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={stats.completionPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {stats.approved} de {templates.length} documentos requeridos
            aprobados
          </p>
        </CardContent>
      </Card>

      {/* Documents by Status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({templates.length - stats.total})
          </TabsTrigger>
          <TabsTrigger value="draft">Borradores ({stats.draft})</TabsTrigger>
          <TabsTrigger value="review">
            En revisión ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobados ({stats.approved})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {templates.map((template) => {
            const doc = getDocumentForTemplate(template.id);
            const statusConfig = doc
              ? getStatusConfig(doc.status)
              : {
                  color: "bg-blue-100 text-blue-800",
                  icon: Plus,
                  label: "Sin iniciar",
                };
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={template.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        {template.required && (
                          <Badge variant="outline" className="mt-1">
                            Requerido
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {doc ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDocument?.(doc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {doc.status !== "APPROVED" &&
                            doc.status !== "SUBMITTED" && (
                              <Button
                                size="sm"
                                onClick={() => onEditDocument?.(doc)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onCreateDocument?.(template)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Crear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {templates
            .filter((t) => !getDocumentForTemplate(t.id))
            .map((template) => (
              <Card key={template.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onCreateDocument?.(template)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {documents
            .filter((d) => d.status === "DRAFT" || d.status === "IN_PROGRESS")
            .map((doc) => {
              const template = templates.find((t) => t.id === doc.templateId);
              return (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Edit className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Última modificación:{" "}
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => onEditDocument?.(doc)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {documents
            .filter((d) => d.status === "SUBMITTED")
            .map((doc) => {
              const template = templates.find((t) => t.id === doc.templateId);
              return (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Enviado:{" "}
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument?.(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {documents
            .filter((d) => d.status === "APPROVED")
            .map((doc) => {
              const template = templates.find((t) => t.id === doc.templateId);
              return (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Aprobado:{" "}
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument?.(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

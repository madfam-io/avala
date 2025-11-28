/**
 * EC0249 Document Templates Seed Data
 *
 * 15 document templates for EC0249 "Proporcionar servicios de consultoría general"
 *
 * Element 1 (E0875): Identificar la situación/problema planteado - 8 templates
 * Element 2 (E0876): Desarrollar opciones de solución - 2 templates
 * Element 3 (E0877): Presentar la propuesta de solución - 5 templates
 */

import { DocumentCategory } from '@prisma/client';

export interface TemplateSection {
  id: string;
  title: string;
  required: boolean;
  type: 'textarea' | 'text' | 'structured' | 'list' | 'matrix';
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    minRows?: number;
    minItems?: number;
  };
  subsections?: Array<{
    id: string;
    title: string;
    type: 'textarea' | 'text' | 'list' | 'matrix';
    headers?: string[];
  }>;
  headers?: string[]; // For matrix type
}

export interface DocumentTemplateData {
  templateCode: string;
  title: string;
  titleEn?: string;
  element: string;
  elementName: string;
  category: DocumentCategory;
  icon?: string;
  description?: string;
  estimatedTime?: number;
  videoId?: string;
  videoTitle?: string;
  videoDescription?: string;
  evaluationCriteria: string[];
  sections: TemplateSection[];
  orderIndex: number;
}

// ============================================
// ELEMENT 1: Problem Identification (E0875)
// ============================================

const element1Templates: DocumentTemplateData[] = [
  {
    templateCode: 'problem_description',
    title: 'Documento que describe el problema planteado',
    titleEn: 'Problem Description Document',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '📋',
    description: 'Documento comprehensivo que describe la situación problemática identificada',
    estimatedTime: 45,
    videoId: 'AM5hrNAbMn8',
    videoTitle: 'EC0249: 2.2) El documento elaborado que describe el problema planteado',
    videoDescription: 'Video explicativo sobre cómo elaborar correctamente el documento que describe el problema planteado',
    evaluationCriteria: [
      'Incluye la afectación de la situación actual',
      'Establece el alcance del problema',
      'Incluye la integración de la información obtenida',
      'Contiene la interpretación del problema y sus afectaciones'
    ],
    sections: [
      {
        id: 'problem_statement',
        title: 'Descripción del Problema',
        required: true,
        type: 'textarea',
        placeholder: 'Describa claramente la situación problemática identificada...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'scope_definition',
        title: 'Alcance del Problema',
        required: true,
        type: 'textarea',
        placeholder: 'Defina el alcance y límites del problema...',
        validation: { minLength: 150, required: true }
      },
      {
        id: 'current_impact',
        title: 'Afectación de la Situación Actual',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'operational_impact', title: 'Impacto Operacional', type: 'textarea' },
          { id: 'financial_impact', title: 'Impacto Financiero', type: 'textarea' },
          { id: 'human_impact', title: 'Impacto en Personal', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'information_integration',
        title: 'Integración de la Información',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'sources_used', title: 'Fuentes de Información Utilizadas', type: 'list' },
          { id: 'data_analysis', title: 'Análisis de Datos', type: 'textarea' },
          { id: 'findings_summary', title: 'Resumen de Hallazgos', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'problem_interpretation',
        title: 'Interpretación del Problema',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione su interpretación profesional del problema y sus implicaciones...',
        validation: { minLength: 300, required: true }
      }
    ],
    orderIndex: 1
  },
  {
    templateCode: 'current_situation_impact',
    title: 'Afectación detectada de la situación actual',
    titleEn: 'Current Situation Impact Assessment',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '⚠️',
    description: 'Análisis detallado de los impactos y afectaciones de la situación actual',
    estimatedTime: 30,
    evaluationCriteria: [
      'Es congruente con la integración de la información'
    ],
    sections: [
      {
        id: 'identified_impacts',
        title: 'Impactos Identificados',
        required: true,
        type: 'matrix',
        headers: ['Área Afectada', 'Tipo de Impacto', 'Severidad', 'Descripción'],
        validation: { minRows: 3, required: true }
      },
      {
        id: 'impact_analysis',
        title: 'Análisis de Congruencia',
        required: true,
        type: 'textarea',
        placeholder: 'Explique la congruencia entre los impactos detectados y la información integrada...',
        validation: { minLength: 200, required: true }
      }
    ],
    orderIndex: 2
  },
  {
    templateCode: 'information_integration',
    title: 'Integración de la información presentada',
    titleEn: 'Information Integration Document',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '🔗',
    description: 'Síntesis y organización de toda la información recopilada',
    estimatedTime: 60,
    evaluationCriteria: [
      'Incluye la información recopilada',
      'Es congruente con el problema planteado por el consultante',
      'Incluye la interpretación de la información recopilada'
    ],
    sections: [
      {
        id: 'collected_information',
        title: 'Información Recopilada',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'primary_sources', title: 'Fuentes Primarias', type: 'list' },
          { id: 'secondary_sources', title: 'Fuentes Secundarias', type: 'list' },
          { id: 'internal_data', title: 'Datos Internos', type: 'textarea' },
          { id: 'external_data', title: 'Datos Externos', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'congruency_analysis',
        title: 'Análisis de Congruencia con el Problema',
        required: true,
        type: 'textarea',
        placeholder: 'Analice la congruencia entre la información recopilada y el problema planteado...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'information_interpretation',
        title: 'Interpretación de la Información',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione su interpretación profesional de la información recopilada...',
        validation: { minLength: 250, required: true }
      }
    ],
    orderIndex: 3
  },
  {
    templateCode: 'methodology_report',
    title: 'Reporte de metodología empleada',
    titleEn: 'Methodology Report',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '📊',
    description: 'Descripción completa de la metodología utilizada para la identificación del problema',
    estimatedTime: 90,
    videoId: '03iWP4RsGCU',
    videoTitle: 'EC0249: 2.5) Reporte de la metodología empleada',
    videoDescription: 'Guía detallada para crear un reporte completo de la metodología utilizada',
    evaluationCriteria: [
      'Incluye la definición de la situación y/o problema',
      'Incluye el establecimiento de un programa de entrevistas',
      'Incluye la identificación de las áreas involucradas',
      'Incluye el establecimiento de los estudios/pruebas a realizar',
      'Incluye el establecimiento de los requerimientos de información',
      'Incluye el establecimiento de un programa de observaciones de campo',
      'Incluye la búsqueda de información documental',
      'Contiene la forma en que evalúa la información obtenida'
    ],
    sections: [
      {
        id: 'situation_definition',
        title: 'Definición de la Situación/Problema',
        required: true,
        type: 'textarea',
        placeholder: 'Defina claramente la situación o problema identificado...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'interview_program',
        title: 'Programa de Entrevistas',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'interview_schedule', title: 'Cronograma de Entrevistas', type: 'matrix', headers: ['Fecha', 'Hora', 'Participante', 'Objetivo'] },
          { id: 'interview_participants', title: 'Participantes', type: 'list' },
          { id: 'interview_methodology', title: 'Metodología de Entrevistas', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'involved_areas',
        title: 'Áreas Involucradas',
        required: true,
        type: 'list',
        placeholder: 'Liste las áreas de la organización involucradas...',
        validation: { minItems: 2, required: true }
      },
      {
        id: 'studies_tests',
        title: 'Estudios/Pruebas a Realizar',
        required: true,
        type: 'matrix',
        headers: ['Estudio/Prueba', 'Objetivo', 'Metodología', 'Resultados Esperados'],
        validation: { minRows: 1, required: true }
      },
      {
        id: 'information_requirements',
        title: 'Requerimientos de Información',
        required: true,
        type: 'list',
        placeholder: 'Liste los requerimientos de información necesarios...',
        validation: { minItems: 3, required: true }
      },
      {
        id: 'field_observation_program',
        title: 'Programa de Observaciones de Campo',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'observation_schedule', title: 'Cronograma de Observaciones', type: 'matrix', headers: ['Fecha', 'Área', 'Objetivo', 'Observador'] },
          { id: 'observation_criteria', title: 'Criterios de Observación', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'documentary_search',
        title: 'Búsqueda de Información Documental',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'internal_documents', title: 'Documentos Internos', type: 'list' },
          { id: 'external_documents', title: 'Documentos Externos', type: 'list' },
          { id: 'search_strategy', title: 'Estrategia de Búsqueda', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'information_evaluation',
        title: 'Evaluación de la Información',
        required: true,
        type: 'textarea',
        placeholder: 'Describa cómo evaluará la información obtenida...',
        validation: { minLength: 200, required: true }
      }
    ],
    orderIndex: 4
  },
  {
    templateCode: 'interview_guide',
    title: 'Guía de entrevista empleada',
    titleEn: 'Interview Guide',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '🎤',
    description: 'Guía estructurada para conducir entrevistas con el consultante',
    estimatedTime: 40,
    evaluationCriteria: [
      'Incluye el propósito de la entrevista',
      'Incluye preguntas sobre las actividades/responsabilidades del entrevistado',
      'Incluye la documentación de información solicitada al entrevistado',
      'Incluye el cierre de la entrevista'
    ],
    sections: [
      {
        id: 'interview_purpose',
        title: 'Propósito de la Entrevista',
        required: true,
        type: 'textarea',
        placeholder: 'Describa el propósito principal de la entrevista...',
        validation: { minLength: 100, required: true }
      },
      {
        id: 'activity_questions',
        title: 'Preguntas sobre Actividades/Responsabilidades',
        required: true,
        type: 'list',
        placeholder: 'Liste las preguntas sobre actividades y responsabilidades...',
        validation: { minItems: 5, required: true }
      },
      {
        id: 'information_documentation',
        title: 'Documentación de Información Solicitada',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'documents_requested', title: 'Documentos Solicitados', type: 'list' },
          { id: 'data_requested', title: 'Datos Específicos Requeridos', type: 'list' },
          { id: 'recording_method', title: 'Método de Registro', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'interview_closure',
        title: 'Cierre de la Entrevista',
        required: true,
        type: 'textarea',
        placeholder: 'Describa cómo cerrará profesionalmente la entrevista...',
        validation: { minLength: 100, required: true }
      }
    ],
    orderIndex: 5
  },
  {
    templateCode: 'questionnaire',
    title: 'Cuestionario elaborado',
    titleEn: 'Questionnaire',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '📝',
    description: 'Cuestionario estructurado para recopilar información del consultante',
    estimatedTime: 50,
    evaluationCriteria: [
      'Incluye la explicación del propósito del cuestionario',
      'Incluye una sección de datos generales',
      'Incluye una cláusula de confidencialidad',
      'Incluye las instrucciones de llenado',
      'Incluye preguntas dirigidas a obtener información para la consultoría',
      'Incluye una sección de documentos de apoyo',
      'Incluye una sección de comentarios',
      'Incluye un mensaje de agradecimiento'
    ],
    sections: [
      {
        id: 'questionnaire_purpose',
        title: 'Propósito del Cuestionario',
        required: true,
        type: 'textarea',
        placeholder: 'Explique claramente el propósito del cuestionario...',
        validation: { minLength: 100, required: true }
      },
      {
        id: 'general_data',
        title: 'Datos Generales',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'respondent_name', title: 'Nombre del Encuestado', type: 'text' },
          { id: 'position', title: 'Cargo/Puesto', type: 'text' },
          { id: 'department', title: 'Departamento/Área', type: 'text' },
          { id: 'contact', title: 'Información de Contacto', type: 'text' }
        ],
        validation: { required: true }
      },
      {
        id: 'confidentiality_clause',
        title: 'Cláusula de Confidencialidad',
        required: true,
        type: 'textarea',
        placeholder: 'Incluya la cláusula de confidencialidad...',
        validation: { minLength: 100, required: true }
      },
      {
        id: 'filling_instructions',
        title: 'Instrucciones de Llenado',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione instrucciones claras para el llenado...',
        validation: { minLength: 100, required: true }
      },
      {
        id: 'consulting_questions',
        title: 'Preguntas de Consultoría',
        required: true,
        type: 'list',
        placeholder: 'Liste las preguntas dirigidas a obtener información...',
        validation: { minItems: 10, required: true }
      },
      {
        id: 'support_documents',
        title: 'Documentos de Apoyo',
        required: true,
        type: 'list',
        placeholder: 'Liste los documentos de apoyo solicitados...',
        validation: { minItems: 1, required: true }
      },
      {
        id: 'comments_section',
        title: 'Sección de Comentarios',
        required: true,
        type: 'textarea',
        placeholder: 'Espacio para comentarios adicionales del encuestado...',
        validation: { required: true }
      },
      {
        id: 'thank_you_message',
        title: 'Mensaje de Agradecimiento',
        required: true,
        type: 'textarea',
        placeholder: 'Incluya un mensaje de agradecimiento...',
        validation: { minLength: 50, required: true }
      }
    ],
    orderIndex: 6
  },
  {
    templateCode: 'document_search_program',
    title: 'Programa de búsqueda de información documental',
    titleEn: 'Documentary Information Search Program',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '🔍',
    description: 'Programa estructurado para la búsqueda de información documental',
    estimatedTime: 35,
    evaluationCriteria: [
      'Incluye fuentes internas de información',
      'Incluye fuentes externas de información',
      'Define la estrategia de búsqueda',
      'Incluye criterios de evaluación de fuentes'
    ],
    sections: [
      {
        id: 'internal_sources',
        title: 'Fuentes Internas',
        required: true,
        type: 'matrix',
        headers: ['Fuente', 'Tipo de Documento', 'Ubicación', 'Responsable'],
        validation: { minRows: 3, required: true }
      },
      {
        id: 'external_sources',
        title: 'Fuentes Externas',
        required: true,
        type: 'matrix',
        headers: ['Fuente', 'Tipo de Información', 'URL/Ubicación', 'Relevancia'],
        validation: { minRows: 2, required: true }
      },
      {
        id: 'search_strategy',
        title: 'Estrategia de Búsqueda',
        required: true,
        type: 'textarea',
        placeholder: 'Describa la estrategia de búsqueda de información...',
        validation: { minLength: 150, required: true }
      },
      {
        id: 'source_reliability',
        title: 'Criterios de Confiabilidad de Fuentes',
        required: true,
        type: 'list',
        placeholder: 'Liste los criterios para evaluar la confiabilidad...',
        validation: { minItems: 3, required: true }
      }
    ],
    orderIndex: 7
  },
  {
    templateCode: 'field_visit_report',
    title: 'Reporte de visita de campo',
    titleEn: 'Field Visit Report',
    element: 'E0875',
    elementName: 'Identificar la situación/problema planteado',
    category: 'REQUIRED',
    icon: '🏢',
    description: 'Reporte de observaciones y hallazgos de visitas de campo',
    estimatedTime: 45,
    evaluationCriteria: [
      'Incluye el objetivo de la visita',
      'Define el alcance de la observación',
      'Incluye descripciones detalladas de las observaciones',
      'Presenta los resultados de la visita'
    ],
    sections: [
      {
        id: 'visit_objective',
        title: 'Objetivo de la Visita',
        required: true,
        type: 'textarea',
        placeholder: 'Describa el objetivo principal de la visita de campo...',
        validation: { minLength: 100, required: true }
      },
      {
        id: 'observation_scope',
        title: 'Alcance de la Observación',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'areas_visited', title: 'Áreas Visitadas', type: 'list' },
          { id: 'processes_observed', title: 'Procesos Observados', type: 'list' },
          { id: 'time_spent', title: 'Tiempo de Observación', type: 'text' }
        ],
        validation: { required: true }
      },
      {
        id: 'observation_descriptions',
        title: 'Descripciones de Observaciones',
        required: true,
        type: 'matrix',
        headers: ['Área/Proceso', 'Observación', 'Evidencia', 'Impacto Potencial'],
        validation: { minRows: 5, required: true }
      },
      {
        id: 'visit_results',
        title: 'Resultados de la Visita',
        required: true,
        type: 'textarea',
        placeholder: 'Presente los resultados y conclusiones de la visita...',
        validation: { minLength: 200, required: true }
      }
    ],
    orderIndex: 8
  }
];

// ============================================
// ELEMENT 2: Solution Development (E0876)
// ============================================

const element2Templates: DocumentTemplateData[] = [
  {
    templateCode: 'impact_analysis_report',
    title: 'Reporte de las afectaciones encontradas',
    titleEn: 'Impact Analysis Report',
    element: 'E0876',
    elementName: 'Desarrollar opciones de solución',
    category: 'REQUIRED',
    icon: '📈',
    description: 'Análisis comprehensivo de las afectaciones identificadas',
    estimatedTime: 60,
    videoId: 'vvVUICOvnRs',
    videoTitle: 'EC0249: 3.1) Reporte de las afectaciones encontradas',
    videoDescription: 'Metodología para crear un reporte detallado de las afectaciones',
    evaluationCriteria: [
      'Describe la metodología aplicada',
      'Define las afectaciones encontradas',
      'Incluye la definición detallada de la situación a resolver'
    ],
    sections: [
      {
        id: 'applied_methodology',
        title: 'Metodología Aplicada',
        required: true,
        type: 'textarea',
        placeholder: 'Describa la metodología utilizada para identificar las afectaciones...',
        validation: { minLength: 300, required: true }
      },
      {
        id: 'identified_impacts',
        title: 'Afectaciones Encontradas',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'operational_impacts', title: 'Afectaciones Operacionales', type: 'list' },
          { id: 'financial_impacts', title: 'Afectaciones Financieras', type: 'list' },
          { id: 'human_impacts', title: 'Afectaciones al Personal', type: 'list' },
          { id: 'strategic_impacts', title: 'Afectaciones Estratégicas', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'situation_definition',
        title: 'Definición Detallada de la Situación',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione una definición detallada de la situación que requiere solución...',
        validation: { minLength: 400, required: true }
      }
    ],
    orderIndex: 9
  },
  {
    templateCode: 'solution_design',
    title: 'Solución diseñada',
    titleEn: 'Solution Design Document',
    element: 'E0876',
    elementName: 'Desarrollar opciones de solución',
    category: 'REQUIRED',
    icon: '💡',
    description: 'Diseño detallado de la solución propuesta con justificación',
    estimatedTime: 90,
    videoId: 'Uqs9pO_XpMs',
    videoTitle: 'EC0249: 3.2) La solución diseñada',
    videoDescription: 'Guía para diseñar soluciones efectivas con análisis costo-beneficio',
    evaluationCriteria: [
      'Es congruente con la situación a resolver',
      'Menciona los beneficios de la solución',
      'Menciona las desventajas de la solución',
      'Cuenta con una justificación detallada',
      'Incluye las implicaciones de costo/beneficio'
    ],
    sections: [
      {
        id: 'solution_overview',
        title: 'Descripción General de la Solución',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione una descripción general de la solución propuesta...',
        validation: { minLength: 300, required: true }
      },
      {
        id: 'congruency_analysis',
        title: 'Análisis de Congruencia',
        required: true,
        type: 'textarea',
        placeholder: 'Explique cómo la solución es congruente con la situación identificada...',
        validation: { minLength: 250, required: true }
      },
      {
        id: 'solution_benefits',
        title: 'Beneficios de la Solución',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'short_term_benefits', title: 'Beneficios a Corto Plazo', type: 'list' },
          { id: 'medium_term_benefits', title: 'Beneficios a Mediano Plazo', type: 'list' },
          { id: 'long_term_benefits', title: 'Beneficios a Largo Plazo', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'solution_disadvantages',
        title: 'Desventajas de la Solución',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'implementation_challenges', title: 'Desafíos de Implementación', type: 'list' },
          { id: 'resource_limitations', title: 'Limitaciones de Recursos', type: 'list' },
          { id: 'potential_risks', title: 'Riesgos Potenciales', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'detailed_justification',
        title: 'Justificación Detallada',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione una justificación detallada de la solución...',
        validation: { minLength: 400, required: true }
      },
      {
        id: 'cost_benefit_implications',
        title: 'Implicaciones Costo/Beneficio',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'implementation_costs', title: 'Costos de Implementación', type: 'matrix', headers: ['Categoría', 'Concepto', 'Cantidad', 'Costo Unitario', 'Costo Total'] },
          { id: 'operational_costs', title: 'Costos Operacionales', type: 'matrix', headers: ['Categoría', 'Concepto', 'Frecuencia', 'Costo Periódico'] },
          { id: 'quantified_benefits', title: 'Beneficios Cuantificados', type: 'matrix', headers: ['Beneficio', 'Métrica', 'Valor Esperado', 'Horizonte de Tiempo'] },
          { id: 'roi_analysis', title: 'Análisis de ROI', type: 'textarea' }
        ],
        validation: { required: true }
      }
    ],
    orderIndex: 10
  }
];

// ============================================
// ELEMENT 3: Solution Presentation (E0877)
// ============================================

const element3Templates: DocumentTemplateData[] = [
  {
    templateCode: 'work_proposal',
    title: 'Propuesta de trabajo elaborada',
    titleEn: 'Work Proposal Document',
    element: 'E0877',
    elementName: 'Presentar la propuesta de solución',
    category: 'REQUIRED',
    icon: '📋',
    description: 'Propuesta formal de trabajo con todos los componentes requeridos',
    estimatedTime: 120,
    videoId: 'jFYxjh1H_P8',
    videoTitle: 'EC0249: 4.2) Elaborar la propuesta de trabajo',
    videoDescription: 'Aprende a estructurar propuestas de trabajo profesionales',
    evaluationCriteria: [
      'Incluye los antecedentes y/o el diagnóstico',
      'Incluye la síntesis descriptiva del proyecto propuesto',
      'Especifica el alcance del proyecto propuesto',
      'Describe la solución propuesta en detalle',
      'Incluye un plan de trabajo',
      'Especifica los entregables por parte del consultor',
      'Especifica los riesgos del proyecto',
      'Especifica las responsabilidades del consultor',
      'Especifica las responsabilidades del consultante',
      'Especifica el costo estimado'
    ],
    sections: [
      {
        id: 'background_diagnosis',
        title: 'Antecedentes y Diagnóstico',
        required: true,
        type: 'textarea',
        placeholder: 'Proporcione los antecedentes y diagnóstico de la situación...',
        validation: { minLength: 300, required: true }
      },
      {
        id: 'project_synthesis',
        title: 'Síntesis Descriptiva del Proyecto',
        required: true,
        type: 'textarea',
        placeholder: 'Describa de manera sintética el proyecto propuesto...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'project_scope',
        title: 'Alcance del Proyecto',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'included_activities', title: 'Actividades Incluidas', type: 'list' },
          { id: 'excluded_activities', title: 'Actividades Excluidas', type: 'list' },
          { id: 'scope_limitations', title: 'Limitaciones del Alcance', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'detailed_solution',
        title: 'Solución Propuesta Detallada',
        required: true,
        type: 'textarea',
        placeholder: 'Describa en detalle la solución propuesta...',
        validation: { minLength: 400, required: true }
      },
      {
        id: 'work_plan',
        title: 'Plan de Trabajo',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'project_phases', title: 'Fases del Proyecto', type: 'matrix', headers: ['Fase', 'Duración', 'Objetivos', 'Entregables'] },
          { id: 'timeline', title: 'Cronograma', type: 'matrix', headers: ['Actividad', 'Inicio', 'Fin', 'Duración', 'Dependencias'] },
          { id: 'milestones', title: 'Hitos Principales', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'consultant_deliverables',
        title: 'Entregables del Consultor',
        required: true,
        type: 'matrix',
        headers: ['Entregable', 'Descripción', 'Fecha de Entrega', 'Criterios de Aceptación'],
        validation: { minRows: 3, required: true }
      },
      {
        id: 'project_risks',
        title: 'Riesgos del Proyecto',
        required: true,
        type: 'matrix',
        headers: ['Riesgo', 'Probabilidad', 'Impacto', 'Mitigación'],
        validation: { minRows: 5, required: true }
      },
      {
        id: 'consultant_responsibilities',
        title: 'Responsabilidades del Consultor',
        required: true,
        type: 'list',
        placeholder: 'Liste las responsabilidades del consultor...',
        validation: { minItems: 5, required: true }
      },
      {
        id: 'client_responsibilities',
        title: 'Responsabilidades del Consultante',
        required: true,
        type: 'list',
        placeholder: 'Liste las responsabilidades del cliente...',
        validation: { minItems: 5, required: true }
      },
      {
        id: 'estimated_cost',
        title: 'Costo Estimado',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'cost_breakdown', title: 'Desglose de Costos', type: 'matrix', headers: ['Categoría', 'Concepto', 'Cantidad', 'Precio Unitario', 'Total'] },
          { id: 'payment_terms', title: 'Términos de Pago', type: 'textarea' },
          { id: 'cost_assumptions', title: 'Supuestos de Costo', type: 'list' }
        ],
        validation: { required: true }
      }
    ],
    orderIndex: 11
  },
  {
    templateCode: 'detailed_solution_description',
    title: 'Descripción detallada de la solución propuesta',
    titleEn: 'Detailed Solution Description',
    element: 'E0877',
    elementName: 'Presentar la propuesta de solución',
    category: 'REQUIRED',
    icon: '📄',
    description: 'Descripción completa de la implementación de la solución',
    estimatedTime: 75,
    evaluationCriteria: [
      'Incluye las etapas de implementación',
      'Incluye los resultados esperados',
      'Incluye los indicadores de avance',
      'Incluye los mecanismos de control',
      'Incluye los recursos requeridos'
    ],
    sections: [
      {
        id: 'implementation_stages',
        title: 'Etapas de Implementación',
        required: true,
        type: 'matrix',
        headers: ['Etapa', 'Descripción', 'Duración', 'Responsable', 'Entregables'],
        validation: { minRows: 3, required: true }
      },
      {
        id: 'expected_results',
        title: 'Resultados Esperados',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'quantitative_results', title: 'Resultados Cuantitativos', type: 'list' },
          { id: 'qualitative_results', title: 'Resultados Cualitativos', type: 'list' },
          { id: 'success_criteria', title: 'Criterios de Éxito', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'progress_indicators',
        title: 'Indicadores de Avance',
        required: true,
        type: 'matrix',
        headers: ['Indicador', 'Métrica', 'Meta', 'Frecuencia de Medición', 'Responsable'],
        validation: { minRows: 5, required: true }
      },
      {
        id: 'control_mechanisms',
        title: 'Mecanismos de Control',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'monitoring_methods', title: 'Métodos de Monitoreo', type: 'list' },
          { id: 'reporting_frequency', title: 'Frecuencia de Reporteo', type: 'textarea' },
          { id: 'escalation_procedures', title: 'Procedimientos de Escalación', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'required_resources',
        title: 'Recursos Requeridos',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'human_resources', title: 'Recursos Humanos', type: 'matrix', headers: ['Rol', 'Perfil', 'Cantidad', 'Dedicación'] },
          { id: 'technical_resources', title: 'Recursos Técnicos', type: 'list' },
          { id: 'financial_resources', title: 'Recursos Financieros', type: 'textarea' }
        ],
        validation: { required: true }
      }
    ],
    orderIndex: 12
  },
  {
    templateCode: 'work_plan_document',
    title: 'Plan de trabajo presentado en la propuesta',
    titleEn: 'Work Plan Document',
    element: 'E0877',
    elementName: 'Presentar la propuesta de solución',
    category: 'REQUIRED',
    icon: '📅',
    description: 'Plan de trabajo detallado para la implementación',
    estimatedTime: 60,
    evaluationCriteria: [
      'Incluye actividades detalladas',
      'Incluye recursos asignados',
      'Incluye resultados esperados por actividad'
    ],
    sections: [
      {
        id: 'detailed_activities',
        title: 'Actividades Detalladas',
        required: true,
        type: 'matrix',
        headers: ['ID', 'Actividad', 'Descripción', 'Responsable', 'Duración', 'Dependencias'],
        validation: { minRows: 10, required: true }
      },
      {
        id: 'assigned_resources',
        title: 'Recursos Asignados',
        required: true,
        type: 'matrix',
        headers: ['Actividad', 'Recurso Humano', 'Recurso Material', 'Presupuesto'],
        validation: { minRows: 5, required: true }
      },
      {
        id: 'expected_outcomes',
        title: 'Resultados Esperados por Actividad',
        required: true,
        type: 'matrix',
        headers: ['Actividad', 'Resultado Esperado', 'Indicador de Éxito', 'Evidencia de Cumplimiento'],
        validation: { minRows: 5, required: true }
      }
    ],
    orderIndex: 13
  },
  {
    templateCode: 'activities_schedule',
    title: 'Actividades a desarrollar mencionadas en el plan',
    titleEn: 'Activities Schedule',
    element: 'E0877',
    elementName: 'Presentar la propuesta de solución',
    category: 'REQUIRED',
    icon: '📆',
    description: 'Calendario detallado de actividades con seguimiento',
    estimatedTime: 70,
    evaluationCriteria: [
      'Incluye programación de actividades',
      'Incluye asignación de responsables',
      'Incluye seguimiento de avance',
      'Incluye mecanismos de control y monitoreo'
    ],
    sections: [
      {
        id: 'activity_programming',
        title: 'Programación de Actividades',
        required: true,
        type: 'matrix',
        headers: ['Actividad', 'Fecha Inicio', 'Fecha Fin', 'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
        validation: { minRows: 10, required: true }
      },
      {
        id: 'responsibility_assignment',
        title: 'Asignación de Responsables',
        required: true,
        type: 'matrix',
        headers: ['Actividad', 'Responsable Principal', 'Colaboradores', 'Supervisor'],
        validation: { minRows: 5, required: true }
      },
      {
        id: 'progress_tracking',
        title: 'Seguimiento de Avance',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'tracking_methodology', title: 'Metodología de Seguimiento', type: 'textarea' },
          { id: 'review_checkpoints', title: 'Puntos de Revisión', type: 'list' },
          { id: 'status_reporting', title: 'Formato de Reporte de Estatus', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'control_monitoring',
        title: 'Control y Monitoreo',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'control_tools', title: 'Herramientas de Control', type: 'list' },
          { id: 'monitoring_frequency', title: 'Frecuencia de Monitoreo', type: 'textarea' },
          { id: 'deviation_handling', title: 'Manejo de Desviaciones', type: 'textarea' }
        ],
        validation: { required: true }
      }
    ],
    orderIndex: 14
  },
  {
    templateCode: 'agreement_record',
    title: 'Registro elaborado de los acuerdos alcanzados',
    titleEn: 'Agreement Record',
    element: 'E0877',
    elementName: 'Presentar la propuesta de solución',
    category: 'REQUIRED',
    icon: '🤝',
    description: 'Registro formal de acuerdos con el consultante',
    estimatedTime: 80,
    evaluationCriteria: [
      'Incluye el alcance acordado',
      'Incluye el cronograma acordado',
      'Incluye las responsabilidades acordadas',
      'Incluye los costos acordados',
      'Incluye los términos de pago',
      'Incluye cláusulas de confidencialidad',
      'Incluye cláusulas de propiedad intelectual',
      'Incluye firmas de las partes',
      'Incluye fecha de acuerdo'
    ],
    sections: [
      {
        id: 'agreed_scope',
        title: 'Alcance Acordado',
        required: true,
        type: 'textarea',
        placeholder: 'Describa el alcance acordado del proyecto...',
        validation: { minLength: 300, required: true }
      },
      {
        id: 'agreed_timeline',
        title: 'Cronograma Acordado',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'project_start', title: 'Fecha de Inicio', type: 'text' },
          { id: 'project_end', title: 'Fecha de Término', type: 'text' },
          { id: 'key_milestones', title: 'Hitos Clave Acordados', type: 'matrix', headers: ['Hito', 'Fecha', 'Entregable'] }
        ],
        validation: { required: true }
      },
      {
        id: 'agreed_responsibilities',
        title: 'Responsabilidades Acordadas',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'consultant_agreed', title: 'Responsabilidades del Consultor', type: 'list' },
          { id: 'client_agreed', title: 'Responsabilidades del Consultante', type: 'list' }
        ],
        validation: { required: true }
      },
      {
        id: 'agreed_costs',
        title: 'Costos Acordados',
        required: true,
        type: 'matrix',
        headers: ['Concepto', 'Monto', 'Moneda', 'Notas'],
        validation: { minRows: 1, required: true }
      },
      {
        id: 'payment_terms',
        title: 'Términos de Pago',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'payment_schedule', title: 'Calendario de Pagos', type: 'matrix', headers: ['Pago', 'Monto', 'Fecha', 'Condición'] },
          { id: 'payment_method', title: 'Método de Pago', type: 'textarea' },
          { id: 'invoicing_requirements', title: 'Requisitos de Facturación', type: 'textarea' }
        ],
        validation: { required: true }
      },
      {
        id: 'confidentiality_clause',
        title: 'Cláusula de Confidencialidad',
        required: true,
        type: 'textarea',
        placeholder: 'Incluya la cláusula de confidencialidad acordada...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'intellectual_property_clause',
        title: 'Cláusula de Propiedad Intelectual',
        required: true,
        type: 'textarea',
        placeholder: 'Incluya la cláusula de propiedad intelectual acordada...',
        validation: { minLength: 200, required: true }
      },
      {
        id: 'signatures',
        title: 'Firmas de las Partes',
        required: true,
        type: 'structured',
        subsections: [
          { id: 'consultant_signature', title: 'Firma del Consultor', type: 'text' },
          { id: 'client_signature', title: 'Firma del Consultante', type: 'text' },
          { id: 'witness_signature', title: 'Testigo (opcional)', type: 'text' }
        ],
        validation: { required: true }
      },
      {
        id: 'agreement_date',
        title: 'Fecha del Acuerdo',
        required: true,
        type: 'text',
        placeholder: 'DD/MM/AAAA',
        validation: { required: true }
      }
    ],
    orderIndex: 15
  }
];

// Export all templates
export const ec0249Templates: DocumentTemplateData[] = [
  ...element1Templates,
  ...element2Templates,
  ...element3Templates
];

// Summary statistics
export const ec0249Summary = {
  totalTemplates: ec0249Templates.length,
  element1Count: element1Templates.length,
  element2Count: element2Templates.length,
  element3Count: element3Templates.length,
  totalEstimatedTime: ec0249Templates.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
  elements: {
    E0875: {
      name: 'Identificar la situación/problema planteado',
      templates: element1Templates.map(t => t.templateCode)
    },
    E0876: {
      name: 'Desarrollar opciones de solución',
      templates: element2Templates.map(t => t.templateCode)
    },
    E0877: {
      name: 'Presentar la propuesta de solución',
      templates: element3Templates.map(t => t.templateCode)
    }
  }
};

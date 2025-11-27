/**
 * Document Templates
 *
 * Pre-built templates for EC deliverables and compliance documents
 */

import type { Template, Section } from '../types';

// ============================================
// DC-3 Template
// ============================================

export const DC3Template: Template = {
  id: 'dc3_constancia',
  title: 'Constancia DC-3',
  description: 'Constancia de competencias o habilidades laborales (Formato DC-3)',
  category: 'dc3',
  icon: '📜',
  required: true,
  estimatedTime: 15,
  exportFormats: ['html', 'pdf'],
  status: 'published',
  version: '1.0',
  sections: [
    {
      id: 'empresa',
      title: 'Datos del Centro de Trabajo',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'razonSocial', label: 'Razón Social', type: 'text', required: true },
        { name: 'rfc', label: 'RFC', type: 'text', required: true, validation: { pattern: '^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$' } },
        { name: 'representanteLegal', label: 'Representante Legal', type: 'text', required: true },
        { name: 'domicilio', label: 'Domicilio', type: 'textarea', required: false },
        { name: 'telefono', label: 'Teléfono', type: 'tel', required: false },
      ],
    },
    {
      id: 'trabajador',
      title: 'Datos del Trabajador',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
        { name: 'curp', label: 'CURP', type: 'text', required: true, validation: { pattern: '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$' } },
        { name: 'puesto', label: 'Puesto', type: 'text', required: false },
        { name: 'area', label: 'Área', type: 'text', required: false },
      ],
    },
    {
      id: 'curso',
      title: 'Datos del Curso',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'nombre', label: 'Nombre del Curso', type: 'text', required: true },
        { name: 'duracionHoras', label: 'Duración (horas)', type: 'number', required: true, validation: { min: 1 } },
        { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date', required: true },
        { name: 'fechaFin', label: 'Fecha de Término', type: 'date', required: true },
        { name: 'modalidad', label: 'Modalidad', type: 'select', required: true, options: ['Presencial', 'Virtual', 'Mixta'] },
        { name: 'objetivo', label: 'Objetivo del Curso', type: 'textarea', required: false },
      ],
    },
    {
      id: 'instructor',
      title: 'Datos del Instructor',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'nombre', label: 'Nombre del Instructor', type: 'text', required: true },
        { name: 'curp', label: 'CURP del Instructor', type: 'text', required: false },
        { name: 'numeroRegistroSTPS', label: 'No. de Registro STPS', type: 'text', required: false },
      ],
    },
    {
      id: 'resultado',
      title: 'Resultado',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'aprobado', label: '¿Aprobado?', type: 'checkbox', required: true },
        { name: 'calificacion', label: 'Calificación', type: 'number', required: false, validation: { min: 0, max: 100 } },
        { name: 'observaciones', label: 'Observaciones', type: 'textarea', required: false },
      ],
    },
    {
      id: 'firmas',
      title: 'Firmas',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'firmaTrabajador', title: 'Firma del Trabajador', type: 'signature' },
        { id: 'firmaInstructor', title: 'Firma del Instructor', type: 'signature' },
        { id: 'firmaRepresentante', title: 'Firma del Representante Legal', type: 'signature' },
      ],
    },
  ],
  evaluationCriteria: [
    'Datos completos del centro de trabajo',
    'Datos completos del trabajador con CURP válida',
    'Información completa del curso',
    'Firmas requeridas presentes',
  ],
};

// ============================================
// Generic EC Deliverable Template
// ============================================

export const ECDeliverableTemplate: Template = {
  id: 'ec_deliverable_generic',
  title: 'Entregable EC Genérico',
  description: 'Plantilla genérica para entregables de estándares de competencia',
  category: 'ec_deliverable',
  icon: '📋',
  required: false,
  estimatedTime: 45,
  exportFormats: ['html', 'pdf', 'docx'],
  status: 'published',
  version: '1.0',
  sections: [
    {
      id: 'identificacion',
      title: 'Identificación',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'ecCodigo', label: 'Código del Estándar (EC)', type: 'text', required: true },
        { name: 'ecTitulo', label: 'Título del Estándar', type: 'text', required: true },
        { name: 'elementoNumero', label: 'Número de Elemento', type: 'text', required: false },
        { name: 'elementoTitulo', label: 'Título del Elemento', type: 'text', required: false },
        { name: 'fecha', label: 'Fecha de Elaboración', type: 'date', required: true },
        { name: 'elaboradoPor', label: 'Elaborado Por', type: 'text', required: true },
      ],
    },
    {
      id: 'contenido',
      title: 'Contenido del Entregable',
      type: 'textarea',
      required: true,
      placeholder: 'Desarrolle el contenido del entregable según los criterios de evaluación del estándar...',
      validation: { minLength: 200, required: true },
    },
    {
      id: 'evidencias',
      title: 'Evidencias de Respaldo',
      type: 'list',
      required: false,
      placeholder: 'Liste las evidencias que respaldan este entregable',
      validation: { minItems: 1 },
    },
    {
      id: 'anexos',
      title: 'Anexos',
      type: 'table',
      required: false,
      headers: ['Nombre del Anexo', 'Descripción', 'Tipo de Archivo'],
    },
  ],
  evaluationCriteria: [
    'Identificación completa del estándar y elemento',
    'Contenido desarrollado según criterios de evaluación',
    'Evidencias documentadas',
  ],
};

// ============================================
// Problem Description Template (EC0249 Element 1)
// ============================================

export const ProblemDescriptionTemplate: Template = {
  id: 'problem_description',
  title: 'Documento que describe el problema planteado',
  description: 'Documento comprensivo que describe la situación problemática identificada',
  category: 'ec_deliverable',
  icon: '📋',
  ecCode: 'EC0249',
  element: 'E0875',
  elementName: 'Identificar la situación/problema planteado',
  elementIndex: 1,
  required: true,
  estimatedTime: 45,
  exportFormats: ['html', 'pdf', 'docx'],
  status: 'published',
  version: '1.0',
  videoSupport: {
    id: 'AM5hrNAbMn8',
    title: 'EC0249: El documento elaborado que describe el problema planteado',
    description: 'Video explicativo sobre cómo elaborar correctamente el documento',
  },
  sections: [
    {
      id: 'problem_statement',
      title: 'Descripción del Problema',
      type: 'textarea',
      required: true,
      placeholder: 'Describa claramente la situación problemática identificada...',
      validation: { minLength: 200, required: true },
    },
    {
      id: 'scope_definition',
      title: 'Alcance del Problema',
      type: 'textarea',
      required: true,
      placeholder: 'Defina el alcance y límites del problema...',
      validation: { minLength: 150, required: true },
    },
    {
      id: 'current_impact',
      title: 'Afectación de la Situación Actual',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'operational_impact', title: 'Impacto Operacional', type: 'textarea' },
        { id: 'financial_impact', title: 'Impacto Financiero', type: 'textarea' },
        { id: 'human_impact', title: 'Impacto en Personal', type: 'textarea' },
      ],
    },
    {
      id: 'information_integration',
      title: 'Integración de la Información',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'sources_used', title: 'Fuentes de Información Utilizadas', type: 'list' },
        { id: 'data_analysis', title: 'Análisis de Datos', type: 'textarea' },
        { id: 'findings_summary', title: 'Resumen de Hallazgos', type: 'textarea' },
      ],
    },
    {
      id: 'problem_interpretation',
      title: 'Interpretación del Problema',
      type: 'textarea',
      required: true,
      placeholder: 'Proporcione su interpretación profesional del problema y sus implicaciones...',
      validation: { minLength: 300, required: true },
    },
  ],
  evaluationCriteria: [
    'Incluye la afectación de la situación actual',
    'Establece el alcance del problema',
    'Incluye la integración de la información obtenida',
    'Contiene la interpretación del problema y sus afectaciones',
  ],
};

// ============================================
// Methodology Report Template (EC0249)
// ============================================

export const MethodologyReportTemplate: Template = {
  id: 'methodology_report',
  title: 'Reporte de metodología empleada',
  description: 'Descripción completa de la metodología utilizada para la identificación del problema',
  category: 'ec_deliverable',
  icon: '📊',
  ecCode: 'EC0249',
  element: 'E0875',
  elementName: 'Identificar la situación/problema planteado',
  elementIndex: 1,
  required: true,
  estimatedTime: 90,
  exportFormats: ['html', 'pdf', 'docx'],
  status: 'published',
  version: '1.0',
  sections: [
    {
      id: 'situation_definition',
      title: 'Definición de la Situación/Problema',
      type: 'textarea',
      required: true,
      placeholder: 'Defina claramente la situación o problema identificado...',
      validation: { minLength: 200, required: true },
    },
    {
      id: 'interview_program',
      title: 'Programa de Entrevistas',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'interview_schedule', title: 'Cronograma de Entrevistas', type: 'table', headers: ['Fecha', 'Hora', 'Participante', 'Objetivo'] },
        { id: 'interview_participants', title: 'Participantes', type: 'list' },
        { id: 'interview_methodology', title: 'Metodología de Entrevistas', type: 'textarea' },
      ],
    },
    {
      id: 'involved_areas',
      title: 'Áreas Involucradas',
      type: 'list',
      required: true,
      placeholder: 'Liste todas las áreas organizacionales involucradas...',
      validation: { minItems: 2, required: true },
    },
    {
      id: 'studies_tests',
      title: 'Estudios/Pruebas a Realizar',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'study_types', title: 'Tipos de Estudios', type: 'list' },
        { id: 'test_procedures', title: 'Procedimientos de Prueba', type: 'textarea' },
        { id: 'success_criteria', title: 'Criterios de Éxito', type: 'list' },
      ],
    },
    {
      id: 'information_requirements',
      title: 'Requerimientos de Información',
      type: 'table',
      required: true,
      headers: ['Tipo de Información', 'Fuente', 'Método de Recopilación', 'Responsable'],
      validation: { minRows: 3, required: true },
    },
    {
      id: 'field_observation_program',
      title: 'Programa de Observaciones de Campo',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'observation_sites', title: 'Sitios de Observación', type: 'list' },
        { id: 'observation_schedule', title: 'Cronograma', type: 'table', headers: ['Fecha', 'Hora', 'Sitio', 'Actividad'] },
        { id: 'observation_criteria', title: 'Criterios de Observación', type: 'list' },
      ],
    },
    {
      id: 'documentary_search',
      title: 'Búsqueda de Información Documental',
      type: 'structured',
      required: true,
      subsections: [
        { id: 'document_types', title: 'Tipos de Documentos', type: 'list' },
        { id: 'search_strategy', title: 'Estrategia de Búsqueda', type: 'textarea' },
        { id: 'document_sources', title: 'Fuentes Documentales', type: 'list' },
      ],
    },
    {
      id: 'information_evaluation',
      title: 'Evaluación de la Información',
      type: 'textarea',
      required: true,
      placeholder: 'Describa el método utilizado para evaluar la calidad y relevancia de la información...',
      validation: { minLength: 200, required: true },
    },
  ],
  evaluationCriteria: [
    'Incluye la definición de la situación y/o problema',
    'Incluye el establecimiento de un programa de entrevistas',
    'Incluye la identificación de las áreas involucradas',
    'Incluye el establecimiento de los estudios/pruebas a realizar',
    'Incluye el establecimiento de los requerimientos de información',
    'Incluye el establecimiento de un programa de observaciones de campo',
    'Incluye la búsqueda de información documental',
    'Contiene la forma en que evalúa la información obtenida',
  ],
};

// ============================================
// Certificate Template
// ============================================

export const CertificateTemplate: Template = {
  id: 'completion_certificate',
  title: 'Certificado de Finalización',
  description: 'Certificado de finalización de curso o programa de capacitación',
  category: 'certificate',
  icon: '��',
  required: false,
  estimatedTime: 5,
  exportFormats: ['html', 'pdf'],
  status: 'published',
  version: '1.0',
  sections: [
    {
      id: 'recipient',
      title: 'Datos del Participante',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
        { name: 'curp', label: 'CURP', type: 'text', required: false },
      ],
    },
    {
      id: 'program',
      title: 'Datos del Programa',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'nombreCurso', label: 'Nombre del Curso/Programa', type: 'text', required: true },
        { name: 'duracion', label: 'Duración', type: 'text', required: true },
        { name: 'fechaFinalizacion', label: 'Fecha de Finalización', type: 'date', required: true },
      ],
    },
    {
      id: 'issuance',
      title: 'Datos de Emisión',
      type: 'form_fields',
      required: true,
      fields: [
        { name: 'folio', label: 'Folio', type: 'text', required: true },
        { name: 'fechaEmision', label: 'Fecha de Emisión', type: 'date', required: true },
        { name: 'emitidoPor', label: 'Emitido Por', type: 'text', required: true },
      ],
    },
  ],
  evaluationCriteria: [],
};

// ============================================
// Template Registry
// ============================================

export const SYSTEM_TEMPLATES: Template[] = [
  DC3Template,
  ECDeliverableTemplate,
  ProblemDescriptionTemplate,
  MethodologyReportTemplate,
  CertificateTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): Template | undefined {
  return SYSTEM_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  return SYSTEM_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates by EC code
 */
export function getTemplatesByECCode(ecCode: string): Template[] {
  return SYSTEM_TEMPLATES.filter((t) => t.ecCode === ecCode);
}

/**
 * Get templates by element
 */
export function getTemplatesByElement(element: string): Template[] {
  return SYSTEM_TEMPLATES.filter((t) => t.element === element);
}

/**
 * Get all system templates
 */
export function getAllSystemTemplates(): Template[] {
  return [...SYSTEM_TEMPLATES];
}

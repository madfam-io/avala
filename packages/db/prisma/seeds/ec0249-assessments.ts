/**
 * EC0249 Assessment Seed Data
 *
 * Quiz and question definitions for EC0249 competency assessments
 * Ported from ec0249 SPA AssessmentDefinitions.js
 *
 * Categories:
 * - KNOWLEDGE_TEST: Theoretical understanding
 * - COMPETENCY_ASSESSMENT: EC0249 competency evaluation
 */

import { QuizCategory, QuestionType } from '@prisma/client';

export interface QuestionData {
  // For MULTIPLE_CHOICE
  options?: string[];
  correct?: number | boolean;
  // For SHORT_ANSWER
  sampleAnswer?: string;
  keywords?: string[];
  // For ESSAY
  rubric?: Array<{ criterion: string; maxPoints: number }>;
  // For MATCHING
  pairs?: Array<{ left: string; right: string }>;
}

export interface QuestionSeed {
  type: QuestionType;
  questionText: string;
  explanation?: string;
  points: number;
  competency?: string;
  questionData: QuestionData;
  orderIndex: number;
}

export interface QuizSeed {
  code: string;
  title: string;
  titleEn?: string;
  description?: string;
  moduleId?: string;
  elementId?: string;
  category: QuizCategory;
  timeLimit?: number; // seconds
  passingScore: number;
  allowedAttempts: number;
  questions: QuestionSeed[];
}

// ============================================
// CONSULTING FUNDAMENTALS ASSESSMENT
// ============================================

const fundamentalsAssessment: QuizSeed = {
  code: 'fundamentals_assessment',
  title: 'Evaluación: Fundamentos de Consultoría',
  titleEn: 'Assessment: Consulting Fundamentals',
  description: 'Evaluación de conocimientos básicos sobre consultoría profesional',
  moduleId: 'module1',
  elementId: 'fundamentals',
  category: 'KNOWLEDGE_TEST',
  timeLimit: 1200, // 20 minutes
  passingScore: 70,
  allowedAttempts: 3,
  questions: [
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es el principio ético más importante en la consultoría?',
      explanation: 'La confidencialidad es fundamental para mantener la confianza y proteger la información sensible del cliente.',
      points: 10,
      competency: 'ethics',
      questionData: {
        options: [
          'Maximizar los honorarios del consultor',
          'Mantener la confidencialidad del cliente',
          'Implementar soluciones rápidas',
          'Garantizar resultados inmediatos'
        ],
        correct: 1
      },
      orderIndex: 1
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuáles son las cinco etapas principales del proceso de consultoría?',
      explanation: 'Las cinco etapas del proceso de consultoría son: Contacto inicial, Diagnóstico, Diseño de soluciones, Implementación y Evaluación/seguimiento.',
      points: 10,
      competency: 'process',
      questionData: {
        options: [
          'Contacto, Diagnóstico, Diseño, Implementación, Evaluación',
          'Planificación, Ejecución, Control, Cierre, Reporte',
          'Análisis, Síntesis, Propuesta, Negociación, Contrato',
          'Identificación, Desarrollo, Presentación, Acuerdo, Seguimiento'
        ],
        correct: 0
      },
      orderIndex: 2
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué característica NO es esencial en un consultor profesional?',
      explanation: 'Trabajar sin supervisión no es una característica esencial. Los consultores deben mantener comunicación y colaboración con sus clientes.',
      points: 10,
      competency: 'skills',
      questionData: {
        options: [
          'Conocimientos técnicos especializados',
          'Capacidad de trabajar sin supervisión',
          'Objetividad e imparcialidad',
          'Ética profesional y confidencialidad'
        ],
        correct: 1
      },
      orderIndex: 3
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'La consultoría interna siempre es más efectiva que la consultoría externa.',
      explanation: 'Ambas modalidades tienen ventajas. La consultoría externa aporta perspectiva objetiva, mientras que la interna conoce mejor la organización.',
      points: 10,
      competency: 'types',
      questionData: {
        correct: false
      },
      orderIndex: 4
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es el primer paso para manejar un conflicto de interés?',
      explanation: 'El primer paso es identificar y evaluar el conflicto potencial para determinar su impacto en la objetividad.',
      points: 10,
      competency: 'ethics',
      questionData: {
        options: [
          'Ignorar el conflicto hasta que se resuelva solo',
          'Identificar y evaluar el conflicto potencial',
          'Rechazar inmediatamente el proyecto',
          'Negociar honorarios más altos'
        ],
        correct: 1
      },
      orderIndex: 5
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué técnica de comunicación es más efectiva para confirmar comprensión?',
      explanation: 'Parafrasear permite confirmar que hemos comprendido correctamente el mensaje del interlocutor.',
      points: 10,
      competency: 'communication',
      questionData: {
        options: [
          'Hablar más fuerte',
          'Parafrasear lo escuchado',
          'Interrumpir frecuentemente',
          'Usar jerga técnica'
        ],
        correct: 1
      },
      orderIndex: 6
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es una responsabilidad del consultor hacia la sociedad?',
      explanation: 'Los consultores tienen responsabilidad social de promover prácticas sostenibles y actuar en beneficio del interés público.',
      points: 10,
      competency: 'ethics',
      questionData: {
        options: [
          'Maximizar las ganancias personales',
          'Promover prácticas sostenibles',
          'Mantener información confidencial indefinidamente',
          'Trabajar solo con empresas grandes'
        ],
        correct: 1
      },
      orderIndex: 7
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'La escucha activa requiere interrumpir frecuentemente para mostrar interés.',
      explanation: 'La escucha activa implica prestar atención completa sin interrupciones prematuras, permitiendo al hablante expresarse completamente.',
      points: 10,
      competency: 'communication',
      questionData: {
        correct: false
      },
      orderIndex: 8
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es la mejor estrategia para manejar la resistencia al cambio?',
      explanation: 'La comunicación clara y frecuente ayuda a reducir la incertidumbre y genera confianza en el proceso de cambio.',
      points: 10,
      competency: 'change_management',
      questionData: {
        options: [
          'Imponer el cambio por autoridad',
          'Comunicación clara y frecuente',
          'Ignorar las preocupaciones',
          'Implementar cambios gradualmente sin avisar'
        ],
        correct: 1
      },
      orderIndex: 9
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué tipo de consultoría se enfoca en la mejora de procesos organizacionales?',
      explanation: 'La consultoría operacional se enfoca específicamente en la mejora de procesos, eficiencia y operaciones diarias.',
      points: 10,
      competency: 'types',
      questionData: {
        options: [
          'Consultoría estratégica',
          'Consultoría operacional',
          'Consultoría financiera',
          'Consultoría de recursos humanos'
        ],
        correct: 1
      },
      orderIndex: 10
    }
  ]
};

// ============================================
// ELEMENT 1 (E0875) ASSESSMENT - Problem Identification
// ============================================

const element1Assessment: QuizSeed = {
  code: 'element1_assessment',
  title: 'Evaluación: Identificación de Problemas (E0875)',
  titleEn: 'Assessment: Problem Identification (E0875)',
  description: 'Evaluación de competencias para identificar situaciones y problemas organizacionales',
  moduleId: 'module2',
  elementId: 'E0875',
  category: 'COMPETENCY_ASSESSMENT',
  timeLimit: 1800, // 30 minutes
  passingScore: 75,
  allowedAttempts: 3,
  questions: [
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es el primer paso en la metodología de identificación de problemas?',
      explanation: 'El primer paso es definir claramente la situación o problema, estableciendo los límites y contexto del análisis.',
      points: 10,
      competency: 'methodology',
      questionData: {
        options: [
          'Proponer soluciones inmediatas',
          'Definir la situación y/o problema',
          'Realizar entrevistas masivas',
          'Buscar información externa'
        ],
        correct: 1
      },
      orderIndex: 1
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué debe incluir un programa de entrevistas efectivo?',
      explanation: 'Un programa efectivo debe incluir cronograma detallado, identificación de participantes clave y metodología estructurada.',
      points: 10,
      competency: 'interviews',
      questionData: {
        options: [
          'Solo directivos de alto nivel',
          'Cronograma, participantes y metodología',
          'Únicamente preguntas cerradas',
          'Entrevistas de más de 2 horas'
        ],
        correct: 1
      },
      orderIndex: 2
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'Las observaciones de campo deben realizarse sin que los empleados lo sepan.',
      explanation: 'Las observaciones deben ser transparentes y éticas, informando a los participantes sobre el propósito y proceso.',
      points: 10,
      competency: 'field_observation',
      questionData: {
        correct: false
      },
      orderIndex: 3
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es el propósito principal de una guía de entrevista?',
      explanation: 'La guía estructura la entrevista para obtener información relevante de manera sistemática y completa.',
      points: 10,
      competency: 'interviews',
      questionData: {
        options: [
          'Limitar las respuestas del entrevistado',
          'Estructurar la conversación y obtener información relevante',
          'Impresionar al cliente con preguntas complejas',
          'Completar la entrevista en menos tiempo'
        ],
        correct: 1
      },
      orderIndex: 4
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué elementos debe contener un cuestionario elaborado?',
      explanation: 'Un cuestionario completo debe incluir propósito, sección de datos generales, aviso de confidencialidad e instrucciones claras.',
      points: 10,
      competency: 'questionnaires',
      questionData: {
        options: [
          'Solo preguntas abiertas complejas',
          'Propósito, datos generales, confidencialidad e instrucciones',
          'Únicamente preguntas de opción múltiple',
          'Preguntas personales del entrevistado'
        ],
        correct: 1
      },
      orderIndex: 5
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cómo se debe evaluar la información obtenida?',
      explanation: 'La información debe evaluarse verificando fuentes, contrastando datos múltiples y validando consistencia.',
      points: 10,
      competency: 'information_evaluation',
      questionData: {
        options: [
          'Aceptar toda la información sin cuestionarla',
          'Verificar fuentes, contrastar datos y validar consistencia',
          'Usar solo información cuantitativa',
          'Priorizar opiniones de directivos únicamente'
        ],
        correct: 1
      },
      orderIndex: 6
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'La información documental interna es siempre más confiable que la externa.',
      explanation: 'Ambos tipos de información son valiosos. La externa puede proporcionar perspectiva objetiva y benchmarks.',
      points: 10,
      competency: 'documentary_search',
      questionData: {
        correct: false
      },
      orderIndex: 7
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué debe incluir el reporte de visita de campo?',
      explanation: 'El reporte debe ser completo incluyendo objetivo, alcance, observaciones detalladas y resultados obtenidos.',
      points: 10,
      competency: 'field_observation',
      questionData: {
        options: [
          'Solo conclusiones finales',
          'Objetivo, alcance, observaciones detalladas y resultados',
          'Únicamente aspectos negativos observados',
          'Recomendaciones de solución inmediata'
        ],
        correct: 1
      },
      orderIndex: 8
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cuál es la importancia de la integración de información?',
      explanation: 'La integración permite crear una visión comprehensiva que conecte todos los elementos del problema.',
      points: 10,
      competency: 'information_integration',
      questionData: {
        options: [
          'Reducir el volumen de datos',
          'Crear una visión comprehensiva y coherente del problema',
          'Eliminar información contradictoria',
          'Acelerar el proceso de consultoría'
        ],
        correct: 1
      },
      orderIndex: 9
    },
    {
      type: 'SHORT_ANSWER',
      questionText: 'Describa brevemente los componentes clave de una metodología de identificación de problemas.',
      explanation: 'Los componentes incluyen: definición de la situación, programa de entrevistas, observaciones de campo, búsqueda documental, evaluación de información e integración de hallazgos.',
      points: 15,
      competency: 'methodology',
      questionData: {
        sampleAnswer: 'definición situación entrevistas observaciones documentación evaluación información integración análisis',
        keywords: ['definición', 'situación', 'entrevistas', 'observaciones', 'documentación', 'evaluación', 'integración']
      },
      orderIndex: 10
    }
  ]
};

// ============================================
// ELEMENT 2 (E0876) ASSESSMENT - Solution Development
// ============================================

const element2Assessment: QuizSeed = {
  code: 'element2_assessment',
  title: 'Evaluación: Desarrollo de Soluciones (E0876)',
  titleEn: 'Assessment: Solution Development (E0876)',
  description: 'Evaluación de competencias para desarrollar opciones de solución',
  moduleId: 'module3',
  elementId: 'E0876',
  category: 'COMPETENCY_ASSESSMENT',
  timeLimit: 1500, // 25 minutes
  passingScore: 75,
  allowedAttempts: 3,
  questions: [
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué debe incluir un reporte de afectaciones encontradas?',
      explanation: 'El reporte debe describir la metodología aplicada, las afectaciones encontradas y la definición detallada de la situación a resolver.',
      points: 10,
      competency: 'impact_analysis',
      questionData: {
        options: [
          'Solo una lista de problemas',
          'Metodología aplicada, afectaciones y definición de la situación',
          'Únicamente recomendaciones de solución',
          'Opiniones del consultor'
        ],
        correct: 1
      },
      orderIndex: 1
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué criterios debe cumplir una solución bien diseñada?',
      explanation: 'La solución debe ser congruente con el problema, mencionar beneficios y desventajas, tener justificación detallada e implicaciones de costo/beneficio.',
      points: 10,
      competency: 'solution_design',
      questionData: {
        options: [
          'Ser la más económica posible',
          'Congruencia, beneficios, desventajas, justificación y costo/beneficio',
          'Ser implementable de inmediato',
          'Requerir mínima participación del cliente'
        ],
        correct: 1
      },
      orderIndex: 2
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'Las desventajas de una solución propuesta no deben mencionarse al cliente.',
      explanation: 'Es ético y profesional mencionar tanto beneficios como desventajas para que el cliente tome una decisión informada.',
      points: 10,
      competency: 'ethics',
      questionData: {
        correct: false
      },
      orderIndex: 3
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Por qué es importante el análisis costo/beneficio en el diseño de soluciones?',
      explanation: 'El análisis costo/beneficio permite al cliente evaluar la viabilidad económica y el retorno esperado de la inversión.',
      points: 10,
      competency: 'cost_benefit',
      questionData: {
        options: [
          'Para justificar honorarios altos',
          'Para evaluar viabilidad económica y retorno de inversión',
          'Para impresionar al cliente con números',
          'Es un requisito legal obligatorio'
        ],
        correct: 1
      },
      orderIndex: 4
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué tipos de afectaciones deben identificarse en el análisis?',
      explanation: 'Deben identificarse afectaciones operacionales, financieras, al personal y estratégicas para tener una visión completa.',
      points: 10,
      competency: 'impact_analysis',
      questionData: {
        options: [
          'Solo afectaciones financieras',
          'Operacionales, financieras, al personal y estratégicas',
          'Únicamente las más graves',
          'Las que el cliente mencione'
        ],
        correct: 1
      },
      orderIndex: 5
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'Una solución debe ser congruente con la situación a resolver identificada.',
      explanation: 'La congruencia entre el problema identificado y la solución propuesta es fundamental para la efectividad de la consultoría.',
      points: 10,
      competency: 'solution_design',
      questionData: {
        correct: true
      },
      orderIndex: 6
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué elementos debe incluir la justificación de una solución?',
      explanation: 'La justificación debe explicar por qué la solución es apropiada, sus fundamentos técnicos y cómo resuelve el problema identificado.',
      points: 10,
      competency: 'solution_design',
      questionData: {
        options: [
          'Solo el costo total',
          'Fundamentos técnicos, adecuación al problema y viabilidad',
          'Testimonios de otros clientes',
          'Experiencia previa del consultor'
        ],
        correct: 1
      },
      orderIndex: 7
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Cómo deben presentarse los beneficios de una solución?',
      explanation: 'Los beneficios deben presentarse categorizados por horizonte temporal: corto, mediano y largo plazo.',
      points: 10,
      competency: 'benefits_presentation',
      questionData: {
        options: [
          'En una lista simple sin categorizar',
          'Categorizados por horizonte temporal: corto, mediano y largo plazo',
          'Solo los beneficios financieros',
          'En términos vagos y generales'
        ],
        correct: 1
      },
      orderIndex: 8
    }
  ]
};

// ============================================
// ELEMENT 3 (E0877) ASSESSMENT - Solution Presentation
// ============================================

const element3Assessment: QuizSeed = {
  code: 'element3_assessment',
  title: 'Evaluación: Presentación de Soluciones (E0877)',
  titleEn: 'Assessment: Solution Presentation (E0877)',
  description: 'Evaluación de competencias para presentar propuestas de solución',
  moduleId: 'module4',
  elementId: 'E0877',
  category: 'COMPETENCY_ASSESSMENT',
  timeLimit: 1800, // 30 minutes
  passingScore: 75,
  allowedAttempts: 3,
  questions: [
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué elementos debe contener una propuesta de trabajo?',
      explanation: 'Una propuesta completa incluye antecedentes, síntesis, alcance, solución, plan de trabajo, entregables, riesgos, responsabilidades y costos.',
      points: 10,
      competency: 'work_proposal',
      questionData: {
        options: [
          'Solo el precio y duración',
          'Antecedentes, alcance, solución, plan, entregables, riesgos, responsabilidades y costos',
          'Una carta de presentación formal',
          'El currículum del consultor'
        ],
        correct: 1
      },
      orderIndex: 1
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué debe incluir la descripción detallada de una solución?',
      explanation: 'La descripción debe incluir etapas de implementación, resultados esperados, indicadores de avance, mecanismos de control y recursos requeridos.',
      points: 10,
      competency: 'solution_description',
      questionData: {
        options: [
          'Solo los resultados esperados',
          'Etapas, resultados, indicadores, control y recursos',
          'Una descripción general del enfoque',
          'Comparación con otras soluciones'
        ],
        correct: 1
      },
      orderIndex: 2
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'Los riesgos del proyecto no deben mencionarse en la propuesta de trabajo.',
      explanation: 'Es importante identificar y documentar los riesgos junto con sus estrategias de mitigación para una gestión proactiva.',
      points: 10,
      competency: 'risk_management',
      questionData: {
        correct: false
      },
      orderIndex: 3
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Por qué es importante especificar las responsabilidades del consultante?',
      explanation: 'Definir las responsabilidades del cliente asegura su compromiso y participación necesaria para el éxito del proyecto.',
      points: 10,
      competency: 'responsibilities',
      questionData: {
        options: [
          'Para reducir la carga de trabajo del consultor',
          'Para asegurar el compromiso y participación del cliente',
          'Por requisito legal',
          'Para cobrar más por servicios adicionales'
        ],
        correct: 1
      },
      orderIndex: 4
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué información debe incluir un plan de trabajo efectivo?',
      explanation: 'Un plan efectivo incluye actividades detalladas, recursos asignados y resultados esperados por actividad.',
      points: 10,
      competency: 'work_plan',
      questionData: {
        options: [
          'Solo las fechas de entrega',
          'Actividades detalladas, recursos asignados y resultados esperados',
          'Una lista de tareas generales',
          'El horario de trabajo del consultor'
        ],
        correct: 1
      },
      orderIndex: 5
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué elementos debe incluir el registro de acuerdos?',
      explanation: 'El registro debe incluir alcance, cronograma, responsabilidades, costos, términos de pago, confidencialidad, propiedad intelectual y firmas.',
      points: 10,
      competency: 'agreement_record',
      questionData: {
        options: [
          'Solo el monto y forma de pago',
          'Alcance, cronograma, responsabilidades, costos, confidencialidad, PI y firmas',
          'Una descripción del proyecto',
          'El contrato estándar del consultor'
        ],
        correct: 1
      },
      orderIndex: 6
    },
    {
      type: 'TRUE_FALSE',
      questionText: 'Las cláusulas de confidencialidad son opcionales en un acuerdo de consultoría.',
      explanation: 'La confidencialidad es un aspecto crítico que protege tanto al cliente como al consultor y debe incluirse siempre.',
      points: 10,
      competency: 'confidentiality',
      questionData: {
        correct: false
      },
      orderIndex: 7
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Qué debe incluir la programación de actividades?',
      explanation: 'La programación debe incluir cronograma de actividades, asignación de responsables, seguimiento de avance y mecanismos de control.',
      points: 10,
      competency: 'activities_schedule',
      questionData: {
        options: [
          'Solo un diagrama de Gantt',
          'Cronograma, responsables, seguimiento y mecanismos de control',
          'Las horas de trabajo diarias',
          'El calendario de reuniones'
        ],
        correct: 1
      },
      orderIndex: 8
    },
    {
      type: 'MULTIPLE_CHOICE',
      questionText: '¿Por qué es importante definir indicadores de avance?',
      explanation: 'Los indicadores permiten medir objetivamente el progreso del proyecto y detectar desviaciones a tiempo.',
      points: 10,
      competency: 'progress_indicators',
      questionData: {
        options: [
          'Para justificar los honorarios del consultor',
          'Para medir progreso objetivamente y detectar desviaciones',
          'Por requisito del estándar EC0249',
          'Para impresionar al cliente con métricas'
        ],
        correct: 1
      },
      orderIndex: 9
    },
    {
      type: 'SHORT_ANSWER',
      questionText: 'Liste los componentes principales que debe contener una propuesta de trabajo de consultoría.',
      explanation: 'Los componentes principales son: antecedentes/diagnóstico, síntesis del proyecto, alcance, solución detallada, plan de trabajo, entregables, riesgos, responsabilidades y costos.',
      points: 15,
      competency: 'work_proposal',
      questionData: {
        sampleAnswer: 'antecedentes diagnóstico síntesis alcance solución plan trabajo entregables riesgos responsabilidades costos',
        keywords: ['antecedentes', 'alcance', 'solución', 'plan', 'entregables', 'riesgos', 'responsabilidades', 'costos']
      },
      orderIndex: 10
    }
  ]
};

// Export all quizzes
export const ec0249Assessments: QuizSeed[] = [
  fundamentalsAssessment,
  element1Assessment,
  element2Assessment,
  element3Assessment
];

// Summary statistics
export const ec0249AssessmentSummary = {
  totalQuizzes: ec0249Assessments.length,
  totalQuestions: ec0249Assessments.reduce((sum, q) => sum + q.questions.length, 0),
  totalPoints: ec0249Assessments.reduce((sum, q) =>
    sum + q.questions.reduce((qSum, question) => qSum + question.points, 0), 0
  ),
  byElement: {
    fundamentals: { quizCode: 'fundamentals_assessment', questions: fundamentalsAssessment.questions.length },
    E0875: { quizCode: 'element1_assessment', questions: element1Assessment.questions.length },
    E0876: { quizCode: 'element2_assessment', questions: element2Assessment.questions.length },
    E0877: { quizCode: 'element3_assessment', questions: element3Assessment.questions.length }
  },
  questionTypes: {
    MULTIPLE_CHOICE: ec0249Assessments.reduce((sum, q) =>
      sum + q.questions.filter(question => question.type === 'MULTIPLE_CHOICE').length, 0),
    TRUE_FALSE: ec0249Assessments.reduce((sum, q) =>
      sum + q.questions.filter(question => question.type === 'TRUE_FALSE').length, 0),
    SHORT_ANSWER: ec0249Assessments.reduce((sum, q) =>
      sum + q.questions.filter(question => question.type === 'SHORT_ANSWER').length, 0)
  }
};

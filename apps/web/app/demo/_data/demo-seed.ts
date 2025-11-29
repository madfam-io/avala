/**
 * Demo Seed Data
 * 
 * Shared data model for all demo role views.
 * This creates a realistic multi-tenant scenario with:
 * - 1 demo tenant (manufacturing company)
 * - Multiple users across roles
 * - EC-aligned courses with modules/lessons
 * - Realistic progress, assessments, and compliance data
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DemoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'TRAINEE';
  avatar?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  curp?: string;
}

export interface DemoLesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SIMULATION';
  durationMin: number;
  content?: string;
  videoUrl?: string;
}

export interface DemoModule {
  id: string;
  title: string;
  description: string;
  lessons: DemoLesson[];
}

export interface DemoCourse {
  id: string;
  code: string;
  title: string;
  description: string;
  ecCode?: string;
  ecName?: string;
  instructorId: string;
  durationHours: number;
  modules: DemoModule[];
  thumbnail: string;
  category: 'TECHNICAL' | 'SAFETY' | 'QUALITY' | 'LEADERSHIP' | 'COMPLIANCE';
}

export interface DemoEnrollment {
  id: string;
  odlUserId: string;
  courseId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  score?: number;
}

export interface DemoDC3 {
  id: string;
  odlSerial: string;
  traineeId: string;
  courseId: string;
  status: 'ISSUED' | 'REVOKED';
  issuedAt: string;
}

export interface DemoCredential {
  id: string;
  traineeId: string;
  courseId: string;
  achievementName: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
}

export interface DemoAssessment {
  id: string;
  traineeId: string;
  courseId: string;
  type: 'QUIZ' | 'SIMULATION' | 'PRACTICAL';
  status: 'PENDING' | 'GRADED';
  score?: number;
  submittedAt: string;
  gradedAt?: string;
}

export interface DemoTenant {
  id: string;
  name: string;
  legalName: string;
  rfc: string;
  industry: string;
  employeeCount: number;
  logo?: string;
}

// ============================================================================
// DEMO TENANT
// ============================================================================

export const DEMO_TENANT: DemoTenant = {
  id: 'tenant-demo-001',
  name: 'Manufacturas del Norte',
  legalName: 'Manufacturas del Norte S.A. de C.V.',
  rfc: 'MNO850101ABC',
  industry: 'Manufactura Automotriz',
  employeeCount: 450,
  logo: '🏭',
};

// ============================================================================
// DEMO USERS
// ============================================================================

export const DEMO_USERS: DemoUser[] = [
  // HR Manager / Admin
  {
    id: 'user-hr-001',
    firstName: 'Laura',
    lastName: 'Méndez',
    email: 'laura.mendez@manufnorte.mx',
    role: 'ADMIN',
    department: 'Recursos Humanos',
    jobTitle: 'Gerente de Capacitación',
    avatar: '👩‍💼',
  },
  // Instructors
  {
    id: 'user-inst-001',
    firstName: 'Carlos',
    lastName: 'Ramírez',
    email: 'carlos.ramirez@manufnorte.mx',
    role: 'INSTRUCTOR',
    department: 'Producción',
    jobTitle: 'Instructor Técnico Senior',
    avatar: '👨‍🏫',
  },
  {
    id: 'user-inst-002',
    firstName: 'Ana',
    lastName: 'Torres',
    email: 'ana.torres@manufnorte.mx',
    role: 'INSTRUCTOR',
    department: 'Calidad',
    jobTitle: 'Especialista en Calidad',
    avatar: '👩‍🔬',
  },
  // Trainees
  {
    id: 'user-trainee-001',
    firstName: 'Miguel',
    lastName: 'Hernández',
    email: 'miguel.hernandez@manufnorte.mx',
    role: 'TRAINEE',
    department: 'Producción',
    jobTitle: 'Operador CNC',
    hireDate: '2023-03-15',
    curp: 'HEMM950312HDFRGL09',
    avatar: '👷',
  },
  {
    id: 'user-trainee-002',
    firstName: 'Sofía',
    lastName: 'García',
    email: 'sofia.garcia@manufnorte.mx',
    role: 'TRAINEE',
    department: 'Calidad',
    jobTitle: 'Inspector de Calidad',
    hireDate: '2022-08-01',
    curp: 'GASS980520MDFRCF05',
    avatar: '👩‍🔧',
  },
  {
    id: 'user-trainee-003',
    firstName: 'Roberto',
    lastName: 'López',
    email: 'roberto.lopez@manufnorte.mx',
    role: 'TRAINEE',
    department: 'Mantenimiento',
    jobTitle: 'Técnico de Mantenimiento',
    hireDate: '2024-01-10',
    curp: 'LORP000115HDFPZB01',
    avatar: '🧑‍🔧',
  },
  {
    id: 'user-trainee-004',
    firstName: 'Elena',
    lastName: 'Martínez',
    email: 'elena.martinez@manufnorte.mx',
    role: 'TRAINEE',
    department: 'Producción',
    jobTitle: 'Supervisora de Línea',
    hireDate: '2021-06-20',
    curp: 'MAME880620MDFRTL08',
    avatar: '👩‍💼',
  },
  {
    id: 'user-trainee-005',
    firstName: 'Jorge',
    lastName: 'Sánchez',
    email: 'jorge.sanchez@manufnorte.mx',
    role: 'TRAINEE',
    department: 'Logística',
    jobTitle: 'Coordinador de Almacén',
    hireDate: '2023-09-05',
    curp: 'SAJG910905HDFNRR03',
    avatar: '👨‍💼',
  },
];

// ============================================================================
// DEMO COURSES (EC-Aligned)
// ============================================================================

export const DEMO_COURSES: DemoCourse[] = [
  {
    id: 'course-ec0217',
    code: 'EC0217-2025',
    title: 'Impartición de Cursos de Formación del Capital Humano',
    description: 'Desarrolla las competencias para diseñar e impartir cursos de capacitación presenciales, con técnicas didácticas efectivas y evaluación del aprendizaje.',
    ecCode: 'EC0217.01',
    ecName: 'Impartición de cursos de formación del capital humano de manera presencial grupal',
    instructorId: 'user-inst-001',
    durationHours: 40,
    thumbnail: '🎓',
    category: 'LEADERSHIP',
    modules: [
      {
        id: 'mod-ec0217-1',
        title: 'Módulo 1: Preparación del Curso',
        description: 'Diseño instruccional y preparación de materiales',
        lessons: [
          { id: 'les-1-1', title: 'Análisis de necesidades de capacitación', type: 'VIDEO', durationMin: 25, videoUrl: 'https://example.com/video1' },
          { id: 'les-1-2', title: 'Diseño de objetivos de aprendizaje', type: 'TEXT', durationMin: 20, content: 'Los objetivos de aprendizaje son declaraciones claras...' },
          { id: 'les-1-3', title: 'Elaboración de carta descriptiva', type: 'TEXT', durationMin: 30 },
          { id: 'les-1-4', title: 'Quiz: Preparación del curso', type: 'QUIZ', durationMin: 15 },
        ],
      },
      {
        id: 'mod-ec0217-2',
        title: 'Módulo 2: Conducción del Curso',
        description: 'Técnicas de instrucción y manejo de grupos',
        lessons: [
          { id: 'les-2-1', title: 'Técnicas de instrucción grupal', type: 'VIDEO', durationMin: 35 },
          { id: 'les-2-2', title: 'Manejo de dinámicas de grupo', type: 'VIDEO', durationMin: 30 },
          { id: 'les-2-3', title: 'Uso de recursos didácticos', type: 'TEXT', durationMin: 25 },
          { id: 'les-2-4', title: 'Simulación: Conducción de sesión', type: 'SIMULATION', durationMin: 45 },
        ],
      },
      {
        id: 'mod-ec0217-3',
        title: 'Módulo 3: Evaluación del Aprendizaje',
        description: 'Instrumentos y técnicas de evaluación',
        lessons: [
          { id: 'les-3-1', title: 'Tipos de evaluación', type: 'TEXT', durationMin: 20 },
          { id: 'les-3-2', title: 'Diseño de instrumentos de evaluación', type: 'VIDEO', durationMin: 30 },
          { id: 'les-3-3', title: 'Retroalimentación efectiva', type: 'TEXT', durationMin: 20 },
          { id: 'les-3-4', title: 'Evaluación final', type: 'QUIZ', durationMin: 30 },
        ],
      },
    ],
  },
  {
    id: 'course-ec0249',
    code: 'EC0249-2025',
    title: 'Operación de Maquinaria CNC',
    description: 'Competencias para operar centros de maquinado CNC de forma segura y eficiente, incluyendo programación básica y control de calidad.',
    ecCode: 'EC0249',
    ecName: 'Operación de máquinas de control numérico',
    instructorId: 'user-inst-001',
    durationHours: 60,
    thumbnail: '⚙️',
    category: 'TECHNICAL',
    modules: [
      {
        id: 'mod-ec0249-1',
        title: 'Módulo 1: Fundamentos CNC',
        description: 'Introducción a la tecnología de control numérico',
        lessons: [
          { id: 'les-cnc-1-1', title: 'Historia y evolución del CNC', type: 'VIDEO', durationMin: 20 },
          { id: 'les-cnc-1-2', title: 'Tipos de máquinas CNC', type: 'TEXT', durationMin: 25 },
          { id: 'les-cnc-1-3', title: 'Sistemas de coordenadas', type: 'VIDEO', durationMin: 30 },
          { id: 'les-cnc-1-4', title: 'Quiz: Fundamentos', type: 'QUIZ', durationMin: 15 },
        ],
      },
      {
        id: 'mod-ec0249-2',
        title: 'Módulo 2: Programación G-Code',
        description: 'Lenguaje de programación para máquinas CNC',
        lessons: [
          { id: 'les-cnc-2-1', title: 'Estructura de un programa CNC', type: 'TEXT', durationMin: 30 },
          { id: 'les-cnc-2-2', title: 'Códigos G fundamentales', type: 'VIDEO', durationMin: 40 },
          { id: 'les-cnc-2-3', title: 'Códigos M y funciones auxiliares', type: 'VIDEO', durationMin: 35 },
          { id: 'les-cnc-2-4', title: 'Práctica: Programación básica', type: 'SIMULATION', durationMin: 60 },
        ],
      },
      {
        id: 'mod-ec0249-3',
        title: 'Módulo 3: Operación Segura',
        description: 'Procedimientos de seguridad y operación',
        lessons: [
          { id: 'les-cnc-3-1', title: 'EPP y normas de seguridad', type: 'VIDEO', durationMin: 25 },
          { id: 'les-cnc-3-2', title: 'Procedimientos de arranque', type: 'TEXT', durationMin: 20 },
          { id: 'les-cnc-3-3', title: 'Monitoreo durante operación', type: 'VIDEO', durationMin: 30 },
          { id: 'les-cnc-3-4', title: 'Evaluación práctica', type: 'SIMULATION', durationMin: 45 },
        ],
      },
    ],
  },
  {
    id: 'course-safety',
    code: 'SEG-101',
    title: 'Seguridad Industrial Básica',
    description: 'Fundamentos de seguridad en el trabajo, identificación de riesgos, uso de EPP y procedimientos de emergencia.',
    instructorId: 'user-inst-002',
    durationHours: 16,
    thumbnail: '🦺',
    category: 'SAFETY',
    modules: [
      {
        id: 'mod-safety-1',
        title: 'Identificación de Riesgos',
        description: 'Reconocer peligros en el área de trabajo',
        lessons: [
          { id: 'les-saf-1-1', title: 'Tipos de riesgos laborales', type: 'VIDEO', durationMin: 20 },
          { id: 'les-saf-1-2', title: 'Matriz de riesgos', type: 'TEXT', durationMin: 25 },
          { id: 'les-saf-1-3', title: 'Quiz: Identificación', type: 'QUIZ', durationMin: 10 },
        ],
      },
      {
        id: 'mod-safety-2',
        title: 'Equipo de Protección Personal',
        description: 'Selección y uso correcto del EPP',
        lessons: [
          { id: 'les-saf-2-1', title: 'Tipos de EPP', type: 'VIDEO', durationMin: 25 },
          { id: 'les-saf-2-2', title: 'Mantenimiento del EPP', type: 'TEXT', durationMin: 15 },
          { id: 'les-saf-2-3', title: 'Evaluación práctica', type: 'SIMULATION', durationMin: 20 },
        ],
      },
    ],
  },
  {
    id: 'course-quality',
    code: 'CAL-201',
    title: 'Control de Calidad en Manufactura',
    description: 'Técnicas de inspección, control estadístico de procesos y sistemas de gestión de calidad.',
    ecCode: 'EC0356',
    ecName: 'Inspección de producto terminado',
    instructorId: 'user-inst-002',
    durationHours: 32,
    thumbnail: '📊',
    category: 'QUALITY',
    modules: [
      {
        id: 'mod-qual-1',
        title: 'Fundamentos de Calidad',
        description: 'Conceptos y filosofías de calidad',
        lessons: [
          { id: 'les-qual-1-1', title: 'Historia de la calidad', type: 'VIDEO', durationMin: 20 },
          { id: 'les-qual-1-2', title: 'ISO 9001 Fundamentos', type: 'TEXT', durationMin: 30 },
          { id: 'les-qual-1-3', title: 'Las 7 herramientas de calidad', type: 'VIDEO', durationMin: 35 },
        ],
      },
      {
        id: 'mod-qual-2',
        title: 'Control Estadístico de Procesos',
        description: 'SPC y gráficos de control',
        lessons: [
          { id: 'les-qual-2-1', title: 'Introducción a SPC', type: 'VIDEO', durationMin: 25 },
          { id: 'les-qual-2-2', title: 'Gráficos X-R', type: 'TEXT', durationMin: 30 },
          { id: 'les-qual-2-3', title: 'Práctica: Análisis de datos', type: 'SIMULATION', durationMin: 40 },
        ],
      },
    ],
  },
];

// ============================================================================
// DEMO ENROLLMENTS
// ============================================================================

export const DEMO_ENROLLMENTS: DemoEnrollment[] = [
  // Miguel - In progress on EC0249, completed Safety
  { id: 'enr-001', odlUserId: 'user-trainee-001', courseId: 'course-ec0249', status: 'IN_PROGRESS', progress: 65, enrolledAt: '2025-01-15', score: undefined },
  { id: 'enr-002', odlUserId: 'user-trainee-001', courseId: 'course-safety', status: 'COMPLETED', progress: 100, enrolledAt: '2024-11-01', completedAt: '2024-11-20', score: 92 },
  
  // Sofía - Completed Quality, in progress EC0217
  { id: 'enr-003', odlUserId: 'user-trainee-002', courseId: 'course-quality', status: 'COMPLETED', progress: 100, enrolledAt: '2024-10-15', completedAt: '2024-12-01', score: 95 },
  { id: 'enr-004', odlUserId: 'user-trainee-002', courseId: 'course-ec0217', status: 'IN_PROGRESS', progress: 40, enrolledAt: '2025-01-10' },
  
  // Roberto - Just started Safety
  { id: 'enr-005', odlUserId: 'user-trainee-003', courseId: 'course-safety', status: 'IN_PROGRESS', progress: 25, enrolledAt: '2025-02-01' },
  
  // Elena - Completed EC0217, in progress EC0249
  { id: 'enr-006', odlUserId: 'user-trainee-004', courseId: 'course-ec0217', status: 'COMPLETED', progress: 100, enrolledAt: '2024-08-01', completedAt: '2024-10-15', score: 88 },
  { id: 'enr-007', odlUserId: 'user-trainee-004', courseId: 'course-ec0249', status: 'IN_PROGRESS', progress: 30, enrolledAt: '2025-01-20' },
  { id: 'enr-008', odlUserId: 'user-trainee-004', courseId: 'course-safety', status: 'COMPLETED', progress: 100, enrolledAt: '2024-06-01', completedAt: '2024-06-25', score: 90 },
  
  // Jorge - Not started, just enrolled
  { id: 'enr-009', odlUserId: 'user-trainee-005', courseId: 'course-safety', status: 'NOT_STARTED', progress: 0, enrolledAt: '2025-02-20' },
];

// ============================================================================
// DEMO DC-3 RECORDS
// ============================================================================

export const DEMO_DC3S: DemoDC3[] = [
  { id: 'dc3-001', odlSerial: 'MNO-2024-000001', traineeId: 'user-trainee-001', courseId: 'course-safety', status: 'ISSUED', issuedAt: '2024-11-20' },
  { id: 'dc3-002', odlSerial: 'MNO-2024-000002', traineeId: 'user-trainee-002', courseId: 'course-quality', status: 'ISSUED', issuedAt: '2024-12-01' },
  { id: 'dc3-003', odlSerial: 'MNO-2024-000003', traineeId: 'user-trainee-004', courseId: 'course-ec0217', status: 'ISSUED', issuedAt: '2024-10-15' },
  { id: 'dc3-004', odlSerial: 'MNO-2024-000004', traineeId: 'user-trainee-004', courseId: 'course-safety', status: 'ISSUED', issuedAt: '2024-06-25' },
];

// ============================================================================
// DEMO CREDENTIALS (Open Badges)
// ============================================================================

export const DEMO_CREDENTIALS: DemoCredential[] = [
  { id: 'cred-001', traineeId: 'user-trainee-001', courseId: 'course-safety', achievementName: 'Seguridad Industrial Básica', status: 'ACTIVE', issuedAt: '2024-11-20' },
  { id: 'cred-002', traineeId: 'user-trainee-002', courseId: 'course-quality', achievementName: 'Control de Calidad - EC0356', status: 'ACTIVE', issuedAt: '2024-12-01' },
  { id: 'cred-003', traineeId: 'user-trainee-004', courseId: 'course-ec0217', achievementName: 'Instructor Certificado - EC0217.01', status: 'ACTIVE', issuedAt: '2024-10-15' },
  { id: 'cred-004', traineeId: 'user-trainee-004', courseId: 'course-safety', achievementName: 'Seguridad Industrial Básica', status: 'ACTIVE', issuedAt: '2024-06-25' },
];

// ============================================================================
// DEMO ASSESSMENTS (Pending grading)
// ============================================================================

export const DEMO_ASSESSMENTS: DemoAssessment[] = [
  { id: 'assess-001', traineeId: 'user-trainee-001', courseId: 'course-ec0249', type: 'SIMULATION', status: 'PENDING', submittedAt: '2025-02-25' },
  { id: 'assess-002', traineeId: 'user-trainee-002', courseId: 'course-ec0217', type: 'QUIZ', status: 'PENDING', submittedAt: '2025-02-24' },
  { id: 'assess-003', traineeId: 'user-trainee-003', courseId: 'course-safety', type: 'QUIZ', status: 'GRADED', score: 78, submittedAt: '2025-02-20', gradedAt: '2025-02-21' },
  { id: 'assess-004', traineeId: 'user-trainee-004', courseId: 'course-ec0249', type: 'PRACTICAL', status: 'PENDING', submittedAt: '2025-02-26' },
];

// ============================================================================
// ANALYTICS DATA
// ============================================================================

export const DEMO_ANALYTICS = {
  overview: {
    totalEmployees: 450,
    trainedThisYear: 127,
    completionRate: 84,
    avgScore: 87,
    dc3Generated: 45,
    credentialsIssued: 38,
    complianceRate: 92,
  },
  monthlyDC3: [
    { month: 'Ene', count: 8 },
    { month: 'Feb', count: 12 },
    { month: 'Mar', count: 6 },
    { month: 'Abr', count: 9 },
    { month: 'May', count: 15 },
    { month: 'Jun', count: 11 },
    { month: 'Jul', count: 7 },
    { month: 'Ago', count: 14 },
    { month: 'Sep', count: 10 },
    { month: 'Oct', count: 18 },
    { month: 'Nov', count: 22 },
    { month: 'Dic', count: 15 },
  ],
  departmentProgress: [
    { department: 'Producción', trained: 45, total: 120, compliance: 95 },
    { department: 'Calidad', trained: 28, total: 35, compliance: 100 },
    { department: 'Mantenimiento', trained: 22, total: 40, compliance: 88 },
    { department: 'Logística', trained: 18, total: 30, compliance: 85 },
    { department: 'Administración', trained: 14, total: 25, compliance: 90 },
  ],
  courseCompletions: [
    { course: 'Seguridad Industrial', completions: 89, avgScore: 88 },
    { course: 'EC0217 Instructor', completions: 12, avgScore: 91 },
    { course: 'EC0249 CNC', completions: 34, avgScore: 85 },
    { course: 'Control de Calidad', completions: 28, avgScore: 87 },
  ],
  lftPlanProgress: {
    year: 2025,
    plannedCourses: 24,
    completedCourses: 8,
    plannedHours: 960,
    completedHours: 380,
    plannedBudget: 450000,
    spentBudget: 185000,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getUserById(id: string): DemoUser | undefined {
  return DEMO_USERS.find(u => u.id === id);
}

export function getCourseById(id: string): DemoCourse | undefined {
  return DEMO_COURSES.find(c => c.id === id);
}

export function getEnrollmentsForUser(userId: string): DemoEnrollment[] {
  return DEMO_ENROLLMENTS.filter(e => e.odlUserId === userId);
}

export function getEnrollmentsForCourse(courseId: string): DemoEnrollment[] {
  return DEMO_ENROLLMENTS.filter(e => e.courseId === courseId);
}

export function getDC3sForUser(userId: string): DemoDC3[] {
  return DEMO_DC3S.filter(d => d.traineeId === userId);
}

export function getCredentialsForUser(userId: string): DemoCredential[] {
  return DEMO_CREDENTIALS.filter(c => c.traineeId === userId);
}

export function getPendingAssessments(): DemoAssessment[] {
  return DEMO_ASSESSMENTS.filter(a => a.status === 'PENDING');
}

export function getTrainees(): DemoUser[] {
  return DEMO_USERS.filter(u => u.role === 'TRAINEE');
}

export function getInstructors(): DemoUser[] {
  return DEMO_USERS.filter(u => u.role === 'INSTRUCTOR');
}

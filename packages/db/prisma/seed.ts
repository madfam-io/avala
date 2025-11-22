import { PrismaClient, Role, Plan, CriterionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Create default tenant
  console.log('Creating default tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'madfam' },
    update: {},
    create: {
      name: 'Innovaciones MADFAM',
      slug: 'madfam',
      plan: Plan.ENTERPRISE,
      settings: {
        locale: 'es-MX',
        timezone: 'America/Mexico_City',
        features: {
          ec_mapping: true,
          dc3_generation: true,
          sirce_export: true,
          obv3_credentials: true,
        },
      },
    },
  });
  console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})\n`);

  // 2. Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@avala.local',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@avala.local',
      firstName: 'Admin',
      lastName: 'AVALA',
      role: Role.ADMIN,
      metadata: {
        note: 'Default admin user - change password immediately',
      },
    },
  });
  console.log(`✓ Admin user: ${admin.email}\n`);

  // 3. Create sample users for different roles
  console.log('Creating sample users...');

  const instructor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'instructor@avala.local',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'instructor@avala.local',
      firstName: 'María',
      lastName: 'Instructor',
      role: Role.INSTRUCTOR,
    },
  });

  const assessor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'assessor@avala.local',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'assessor@avala.local',
      firstName: 'Carlos',
      lastName: 'Evaluador',
      role: Role.ASSESSOR,
    },
  });

  const trainee = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'trainee@avala.local',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'trainee@avala.local',
      firstName: 'Juan',
      lastName: 'Aprendiz',
      role: Role.TRAINEE,
    },
  });

  console.log(`✓ Created ${Role.INSTRUCTOR}: ${instructor.email}`);
  console.log(`✓ Created ${Role.ASSESSOR}: ${assessor.email}`);
  console.log(`✓ Created ${Role.TRAINEE}: ${trainee.email}\n`);

  // 4. Create sample EC (EC0217.01 - Impartición de cursos de formación)
  console.log('Creating sample Competency Standard (EC0217.01)...');

  const ec0217 = await prisma.competencyStandard.upsert({
    where: {
      tenantId_code_version: {
        tenantId: tenant.id,
        code: 'EC0217.01',
        version: '1.0',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      issuer: 'CONOCER',
      code: 'EC0217.01',
      title: 'Impartición de cursos de formación del capital humano de manera presencial grupal',
      version: '1.0',
      locale: 'es-MX',
      structure: {
        description: 'Este Estándar de Competencia establece el desempeño para impartir cursos de capacitación.',
        sectors: ['Capacitación y desarrollo'],
        level: 4,
      },
    },
  });
  console.log(`✓ EC created: ${ec0217.code} - ${ec0217.title}\n`);

  // 5. Create Elements for EC0217.01
  console.log('Creating Elements...');

  const element1 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 1,
      title: 'Preparar la sesión de instrucción',
      description: 'Preparar el ambiente de aprendizaje y los recursos didácticos para la sesión.',
    },
  });

  const element2 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 2,
      title: 'Conducir la sesión de instrucción',
      description: 'Facilitar el aprendizaje mediante técnicas didácticas apropiadas.',
    },
  });

  const element3 = await prisma.element.create({
    data: {
      standardId: ec0217.id,
      index: 3,
      title: 'Evaluar el aprendizaje',
      description: 'Aplicar instrumentos de evaluación y retroalimentar a los participantes.',
    },
  });

  console.log(`✓ Created 3 elements\n`);

  // 6. Create Criteria for Element 1
  console.log('Creating Criteria for Element 1...');

  await prisma.criterion.createMany({
    data: [
      {
        elementId: element1.id,
        type: CriterionType.DESEMPENO,
        code: 'D1',
        text: 'Prepara el espacio físico conforme a las necesidades del grupo y el programa.',
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.DESEMPENO,
        code: 'D2',
        text: 'Verifica el funcionamiento de los recursos didácticos y tecnológicos.',
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.PRODUCTO,
        code: 'P1',
        text: 'La carta descriptiva del curso está completa y actualizada.',
        weight: 1.0,
      },
      {
        elementId: element1.id,
        type: CriterionType.CONOCIMIENTO,
        code: 'C1',
        text: 'Conoce los estilos de aprendizaje y las teorías de aprendizaje para adultos.',
        weight: 1.0,
      },
    ],
  });

  // Create Criteria for Element 2
  await prisma.criterion.createMany({
    data: [
      {
        elementId: element2.id,
        type: CriterionType.DESEMPENO,
        code: 'D3',
        text: 'Presenta los objetivos de aprendizaje al inicio de la sesión.',
        weight: 1.0,
      },
      {
        elementId: element2.id,
        type: CriterionType.DESEMPENO,
        code: 'D4',
        text: 'Aplica técnicas didácticas variadas para mantener la participación.',
        weight: 1.0,
      },
      {
        elementId: element2.id,
        type: CriterionType.ACTITUD,
        code: 'A1',
        text: 'Muestra respeto e inclusión hacia todos los participantes.',
        weight: 1.0,
      },
    ],
  });

  // Create Criteria for Element 3
  await prisma.criterion.createMany({
    data: [
      {
        elementId: element3.id,
        type: CriterionType.DESEMPENO,
        code: 'D5',
        text: 'Aplica instrumentos de evaluación alineados a los objetivos.',
        weight: 1.0,
      },
      {
        elementId: element3.id,
        type: CriterionType.PRODUCTO,
        code: 'P2',
        text: 'El reporte de evaluación documenta el progreso de cada participante.',
        weight: 1.0,
      },
      {
        elementId: element3.id,
        type: CriterionType.CONOCIMIENTO,
        code: 'C2',
        text: 'Conoce técnicas de evaluación formativa y sumativa.',
        weight: 1.0,
      },
    ],
  });

  console.log(`✓ Created 10 criteria across 3 elements\n`);

  // 7. Create a sample course mapped to EC0217
  console.log('Creating sample course...');

  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      ownerId: instructor.id,
      title: 'Formación de Instructores Internos',
      description: 'Curso para desarrollar competencias de instructores conforme EC0217.01',
      version: '1.0',
      status: 'PUBLISHED',
      ecCodes: ['EC0217.01'],
      publishedAt: new Date(),
      standards: {
        connect: [{ id: ec0217.id }],
      },
    },
  });

  console.log(`✓ Course created: ${course.title}\n`);

  // 8. Create a Path
  console.log('Creating learning path...');

  const path = await prisma.path.create({
    data: {
      tenantId: tenant.id,
      title: 'Certificación de Instructores',
      description: 'Ruta para certificación interna como instructor',
      items: {
        create: [
          {
            courseId: course.id,
            order: 1,
            required: true,
          },
        ],
      },
    },
  });

  console.log(`✓ Path created: ${path.title}\n`);

  // 9. Create sample portfolio for trainee
  console.log('Creating sample portfolio...');

  const portfolio = await prisma.portfolio.create({
    data: {
      tenantId: tenant.id,
      traineeId: trainee.id,
      title: 'Portfolio - EC0217.01',
      status: 'DRAFT',
      summaryJson: {
        standardCode: 'EC0217.01',
        progress: 0,
      },
    },
  });

  console.log(`✓ Portfolio created for ${trainee.email}\n`);

  console.log('✅ Seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: 4 (admin, instructor, assessor, trainee)`);
  console.log(`   - EC Standards: 1 (EC0217.01)`);
  console.log(`   - Elements: 3`);
  console.log(`   - Criteria: 10`);
  console.log(`   - Courses: 1`);
  console.log(`   - Paths: 1`);
  console.log(`   - Portfolios: 1\n`);
  console.log('🔐 Login credentials:');
  console.log(`   Email: admin@avala.local`);
  console.log(`   Password: (set via auth system)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

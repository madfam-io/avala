/**
 * Jest E2E Test Setup
 * Configures test environment and global utilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Global test utilities
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply same configuration as main app
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

// Clean up after all tests
afterAll(async () => {
  // Any global cleanup
});

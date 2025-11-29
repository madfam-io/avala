/**
 * E2E Test Module
 * Minimal test module for auth E2E tests
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";

// Auth
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { JanuaAuthService } from "../src/modules/auth/janua-auth.service";
import { JwtStrategy } from "../src/modules/auth/strategies/jwt.strategy";
import { LocalStrategy } from "../src/modules/auth/strategies/local.strategy";

// Database
import { PrismaService } from "../src/database/prisma.service";

/**
 * Mock PrismaService for E2E tests
 */
export class MockPrismaService {
  private users: any[] = [];
  private tenants: any[] = [];

  constructor() {
    this.seedTestData();
  }

  private seedTestData() {
    // Default tenant
    this.tenants.push({
      id: "test-tenant-id",
      name: "Test Tenant",
      slug: "test-tenant",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default admin user (password: "password123")
    // bcrypt hash for "password123" with 10 rounds
    this.users.push({
      id: "test-user-id",
      email: "admin@test.com",
      password: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // "password123"
      firstName: "Test",
      lastName: "Admin",
      role: "ADMIN",
      tenantId: "test-tenant-id",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenant: {
        id: "test-tenant-id",
        name: "Test Tenant",
        slug: "test-tenant",
      },
    });

    // Default trainee user
    this.users.push({
      id: "test-trainee-id",
      email: "trainee@test.com",
      password: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
      firstName: "Test",
      lastName: "Trainee",
      role: "TRAINEE",
      tenantId: "test-tenant-id",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenant: {
        id: "test-tenant-id",
        name: "Test Tenant",
        slug: "test-tenant",
      },
    });
  }

  // User operations
  user = {
    findUnique: jest.fn().mockImplementation(({ where, include }) => {
      let user = null;
      if (where.id) {
        user = this.users.find((u) => u.id === where.id);
      }
      if (where.email) {
        user = this.users.find((u) => u.email === where.email);
      }
      if (user && include?.tenant) {
        return Promise.resolve({ ...user });
      }
      return Promise.resolve(user ? { ...user, tenant: undefined } : null);
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      const user = this.users.find((u) => {
        if (where.email) return u.email === where.email;
        if (where.id) return u.id === where.id;
        return false;
      });
      return Promise.resolve(user || null);
    }),
    findMany: jest.fn().mockImplementation(() => Promise.resolve(this.users)),
    create: jest.fn().mockImplementation(({ data }) => {
      const user = {
        id: `user-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(user);
      return Promise.resolve(user);
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      const index = this.users.findIndex((u) => u.id === where.id);
      if (index >= 0) {
        this.users[index] = {
          ...this.users[index],
          ...data,
          updatedAt: new Date(),
        };
        return Promise.resolve(this.users[index]);
      }
      return Promise.resolve(null);
    }),
  };

  // Tenant operations
  tenant = {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve(
        this.tenants.find((t) => t.id === where.id || t.slug === where.slug),
      );
    }),
    findMany: jest.fn().mockImplementation(() => Promise.resolve(this.tenants)),
  };

  // Utility methods
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $transaction = jest.fn().mockImplementation((fn) => fn(this));
}

/**
 * Mock JanuaAuthService
 */
export class MockJanuaAuthService {
  getAuthorizationUrl = jest
    .fn()
    .mockReturnValue("https://janua.test/auth?client_id=test");
  handleSsoCallback = jest.fn().mockResolvedValue({
    accessToken: "test-access-token",
    user: {
      id: "test-user-id",
      email: "admin@test.com",
      firstName: "Test",
      lastName: "Admin",
      role: "ADMIN",
      tenantId: "test-tenant-id",
    },
  });
  refreshTokens = jest.fn().mockResolvedValue(undefined);
  logout = jest.fn().mockResolvedValue(undefined);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          JWT_SECRET: "test-jwt-secret",
          JWT_EXPIRATION: "1d",
        }),
      ],
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: "test-jwt-secret",
      signOptions: { expiresIn: "1d" },
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 100 },
      { name: "medium", ttl: 10000, limit: 100 },
      { name: "long", ttl: 60000, limit: 100 },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    { provide: PrismaService, useClass: MockPrismaService },
    {
      provide: JanuaAuthService,
      useClass: MockJanuaAuthService,
    },
  ],
})
export class TestModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, JwtPayload } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'TRAINEE',
    tenantId: 'tenant-123',
    status: 'ACTIVE',
    tenant: {
      id: 'tenant-123',
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'changeme');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          status: 'ACTIVE',
        },
        include: {
          tenant: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user info on successful login', async () => {
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(mockTenant as any);

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when tenant not found', async () => {
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(null);

      await expect(service.login(mockUser as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when JWT payload is valid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const payload: JwtPayload = {
        sub: 'invalid-user',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null when tenant ID mismatch', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'different-tenant', // Mismatch
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await service.hashPassword('testpassword');

      expect(hash).toBeDefined();
      expect(hash).not.toBe('testpassword');
      expect(hash.length).toBeGreaterThan(20);
    });
  });
});

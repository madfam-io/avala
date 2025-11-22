import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@avala/db';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials (used by LocalStrategy)
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    // For Phase 1-A, we'll do simple password check
    // In production, use bcrypt.compare with hashed passwords
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return null;
    }

    // Temporary: For demo, accept any password for seeded users
    // In production: await bcrypt.compare(password, user.passwordHash)
    if (password === 'changeme' || password === 'password') {
      return user;
    }

    return null;
  }

  /**
   * Login and generate JWT tokens
   */
  async login(user: User) {
    // Fetch tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      accessToken,
    };
  }

  /**
   * Validate JWT payload (used by JwtStrategy)
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Verify tenant hasn't changed
    if (user.tenantId !== payload.tenantId) {
      return null;
    }

    return user;
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    });
  }

  /**
   * Hash password (for future user registration)
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

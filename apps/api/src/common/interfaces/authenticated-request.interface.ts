import { Request } from "express";
import { User } from "@avala/db";

/**
 * JWT payload structure for authenticated users
 */
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  januaSub?: string;
  iat?: number;
  exp?: number;
}

/**
 * Express Request with authenticated user (full Prisma User) attached by JWT strategy
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

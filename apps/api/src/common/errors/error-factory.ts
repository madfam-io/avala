import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * ErrorFactory - Centralized error creation for consistent error handling
 * Reduces duplication across services and ensures consistent error messages
 */
export class ErrorFactory {
  // ============================================
  // Not Found Errors
  // ============================================

  static notFound(entity: string, identifier?: string | number): NotFoundException {
    const message = identifier
      ? `${entity} with ID ${identifier} not found`
      : `${entity} not found`;
    return new NotFoundException(message);
  }

  static ecStandardNotFound(ecCode: string): NotFoundException {
    return new NotFoundException(`EC Standard ${ecCode} not found`);
  }

  static enrollmentNotFound(id: string): NotFoundException {
    return new NotFoundException(`Enrollment ${id} not found`);
  }

  static userNotFound(id: string): NotFoundException {
    return new NotFoundException(`User ${id} not found`);
  }

  static tenantNotFound(id: string): NotFoundException {
    return new NotFoundException(`Tenant ${id} not found`);
  }

  static courseNotFound(id: string): NotFoundException {
    return new NotFoundException(`Course ${id} not found`);
  }

  static moduleNotFound(id: string): NotFoundException {
    return new NotFoundException(`Module ${id} not found`);
  }

  static lessonNotFound(id: string): NotFoundException {
    return new NotFoundException(`Lesson ${id} not found`);
  }

  static assessmentNotFound(id: string): NotFoundException {
    return new NotFoundException(`Assessment ${id} not found`);
  }

  static documentNotFound(id: string): NotFoundException {
    return new NotFoundException(`Document ${id} not found`);
  }

  static templateNotFound(id: string): NotFoundException {
    return new NotFoundException(`Template ${id} not found`);
  }

  static attemptNotFound(id: string): NotFoundException {
    return new NotFoundException(`Attempt ${id} not found`);
  }

  static certificateNotFound(id: string): NotFoundException {
    return new NotFoundException(`Certificate ${id} not found`);
  }

  // ============================================
  // Bad Request Errors
  // ============================================

  static badRequest(message: string): BadRequestException {
    return new BadRequestException(message);
  }

  static invalidField(field: string, reason?: string): BadRequestException {
    const message = reason
      ? `Invalid ${field}: ${reason}`
      : `Invalid ${field}`;
    return new BadRequestException(message);
  }

  static missingField(field: string): BadRequestException {
    return new BadRequestException(`Missing required field: ${field}`);
  }

  static invalidStatus(entity: string, currentStatus: string, expectedStatus: string): BadRequestException {
    return new BadRequestException(
      `${entity} status is ${currentStatus}, expected ${expectedStatus}`,
    );
  }

  static invalidTransition(from: string, to: string): BadRequestException {
    return new BadRequestException(
      `Invalid status transition from ${from} to ${to}`,
    );
  }

  static assessmentAlreadySubmitted(): BadRequestException {
    return new BadRequestException('Assessment attempt has already been submitted');
  }

  static enrollmentRequired(): BadRequestException {
    return new BadRequestException('Active enrollment required for this action');
  }

  static prerequisiteNotMet(prerequisite: string): BadRequestException {
    return new BadRequestException(`Prerequisite not met: ${prerequisite}`);
  }

  static limitExceeded(resource: string, limit: number): BadRequestException {
    return new BadRequestException(`${resource} limit of ${limit} exceeded`);
  }

  static invalidDateRange(): BadRequestException {
    return new BadRequestException('Invalid date range: start date must be before end date');
  }

  static expired(entity: string): BadRequestException {
    return new BadRequestException(`${entity} has expired`);
  }

  // ============================================
  // Conflict Errors
  // ============================================

  static conflict(message: string): ConflictException {
    return new ConflictException(message);
  }

  static alreadyExists(entity: string, identifier?: string): ConflictException {
    const message = identifier
      ? `${entity} with identifier ${identifier} already exists`
      : `${entity} already exists`;
    return new ConflictException(message);
  }

  static alreadyEnrolled(ecCode: string): ConflictException {
    return new ConflictException(`Already enrolled in EC Standard ${ecCode}`);
  }

  static duplicateEntry(field: string, value: string): ConflictException {
    return new ConflictException(`Duplicate ${field}: ${value}`);
  }

  // ============================================
  // Authorization Errors
  // ============================================

  static unauthorized(message?: string): UnauthorizedException {
    return new UnauthorizedException(message || 'Unauthorized');
  }

  static invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException('Invalid credentials');
  }

  static tokenExpired(): UnauthorizedException {
    return new UnauthorizedException('Token has expired');
  }

  static forbidden(message?: string): ForbiddenException {
    return new ForbiddenException(message || 'Access denied');
  }

  static insufficientPermissions(action: string): ForbiddenException {
    return new ForbiddenException(`Insufficient permissions to ${action}`);
  }

  static tenantMismatch(): ForbiddenException {
    return new ForbiddenException('Access denied: tenant mismatch');
  }

  // ============================================
  // Server Errors
  // ============================================

  static internalError(message?: string): InternalServerErrorException {
    return new InternalServerErrorException(
      message || 'An unexpected error occurred',
    );
  }

  static serviceUnavailable(service: string): InternalServerErrorException {
    return new InternalServerErrorException(`${service} service is unavailable`);
  }

  static databaseError(operation: string): InternalServerErrorException {
    return new InternalServerErrorException(`Database error during ${operation}`);
  }
}

// Convenience type for error checking
export type AppException =
  | NotFoundException
  | BadRequestException
  | ConflictException
  | UnauthorizedException
  | ForbiddenException
  | InternalServerErrorException;

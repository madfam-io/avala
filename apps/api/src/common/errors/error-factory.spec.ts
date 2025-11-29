import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ErrorFactory } from "./error-factory";

describe("ErrorFactory", () => {
  // ============================================
  // Not Found Errors
  // ============================================
  describe("Not Found Errors", () => {
    describe("notFound", () => {
      it("should create NotFoundException with entity and identifier", () => {
        const error = ErrorFactory.notFound("User", "123");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("User with ID 123 not found");
      });

      it("should create NotFoundException with entity only", () => {
        const error = ErrorFactory.notFound("User");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("User not found");
      });

      it("should handle numeric identifier", () => {
        const error = ErrorFactory.notFound("Record", 456);

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Record with ID 456 not found");
      });
    });

    describe("ecStandardNotFound", () => {
      it("should create NotFoundException for EC Standard", () => {
        const error = ErrorFactory.ecStandardNotFound("EC-001");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("EC Standard EC-001 not found");
      });
    });

    describe("enrollmentNotFound", () => {
      it("should create NotFoundException for enrollment", () => {
        const error = ErrorFactory.enrollmentNotFound("enroll-123");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Enrollment enroll-123 not found");
      });
    });

    describe("userNotFound", () => {
      it("should create NotFoundException for user", () => {
        const error = ErrorFactory.userNotFound("user-abc");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("User user-abc not found");
      });
    });

    describe("tenantNotFound", () => {
      it("should create NotFoundException for tenant", () => {
        const error = ErrorFactory.tenantNotFound("tenant-xyz");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Tenant tenant-xyz not found");
      });
    });

    describe("courseNotFound", () => {
      it("should create NotFoundException for course", () => {
        const error = ErrorFactory.courseNotFound("course-101");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Course course-101 not found");
      });
    });

    describe("moduleNotFound", () => {
      it("should create NotFoundException for module", () => {
        const error = ErrorFactory.moduleNotFound("module-1");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Module module-1 not found");
      });
    });

    describe("lessonNotFound", () => {
      it("should create NotFoundException for lesson", () => {
        const error = ErrorFactory.lessonNotFound("lesson-5");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Lesson lesson-5 not found");
      });
    });

    describe("assessmentNotFound", () => {
      it("should create NotFoundException for assessment", () => {
        const error = ErrorFactory.assessmentNotFound("assess-10");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Assessment assess-10 not found");
      });
    });

    describe("documentNotFound", () => {
      it("should create NotFoundException for document", () => {
        const error = ErrorFactory.documentNotFound("doc-42");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Document doc-42 not found");
      });
    });

    describe("templateNotFound", () => {
      it("should create NotFoundException for template", () => {
        const error = ErrorFactory.templateNotFound("template-a");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Template template-a not found");
      });
    });

    describe("attemptNotFound", () => {
      it("should create NotFoundException for attempt", () => {
        const error = ErrorFactory.attemptNotFound("attempt-99");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Attempt attempt-99 not found");
      });
    });

    describe("certificateNotFound", () => {
      it("should create NotFoundException for certificate", () => {
        const error = ErrorFactory.certificateNotFound("cert-007");

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe("Certificate cert-007 not found");
      });
    });
  });

  // ============================================
  // Bad Request Errors
  // ============================================
  describe("Bad Request Errors", () => {
    describe("badRequest", () => {
      it("should create BadRequestException with message", () => {
        const error = ErrorFactory.badRequest("Custom error message");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Custom error message");
      });
    });

    describe("invalidField", () => {
      it("should create BadRequestException with field and reason", () => {
        const error = ErrorFactory.invalidField("email", "invalid format");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Invalid email: invalid format");
      });

      it("should create BadRequestException with field only", () => {
        const error = ErrorFactory.invalidField("phone");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Invalid phone");
      });
    });

    describe("missingField", () => {
      it("should create BadRequestException for missing field", () => {
        const error = ErrorFactory.missingField("username");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Missing required field: username");
      });
    });

    describe("invalidStatus", () => {
      it("should create BadRequestException for invalid status", () => {
        const error = ErrorFactory.invalidStatus(
          "Order",
          "CANCELLED",
          "PENDING",
        );

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          "Order status is CANCELLED, expected PENDING",
        );
      });
    });

    describe("invalidTransition", () => {
      it("should create BadRequestException for invalid transition", () => {
        const error = ErrorFactory.invalidTransition("DRAFT", "COMPLETED");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          "Invalid status transition from DRAFT to COMPLETED",
        );
      });
    });

    describe("assessmentAlreadySubmitted", () => {
      it("should create BadRequestException for already submitted assessment", () => {
        const error = ErrorFactory.assessmentAlreadySubmitted();

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          "Assessment attempt has already been submitted",
        );
      });
    });

    describe("enrollmentRequired", () => {
      it("should create BadRequestException when enrollment is required", () => {
        const error = ErrorFactory.enrollmentRequired();

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          "Active enrollment required for this action",
        );
      });
    });

    describe("prerequisiteNotMet", () => {
      it("should create BadRequestException for unmet prerequisite", () => {
        const error = ErrorFactory.prerequisiteNotMet("Complete Module 1");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Prerequisite not met: Complete Module 1");
      });
    });

    describe("limitExceeded", () => {
      it("should create BadRequestException when limit is exceeded", () => {
        const error = ErrorFactory.limitExceeded("File uploads", 10);

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("File uploads limit of 10 exceeded");
      });
    });

    describe("invalidDateRange", () => {
      it("should create BadRequestException for invalid date range", () => {
        const error = ErrorFactory.invalidDateRange();

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          "Invalid date range: start date must be before end date",
        );
      });
    });

    describe("expired", () => {
      it("should create BadRequestException for expired entity", () => {
        const error = ErrorFactory.expired("Session");

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Session has expired");
      });
    });
  });

  // ============================================
  // Conflict Errors
  // ============================================
  describe("Conflict Errors", () => {
    describe("conflict", () => {
      it("should create ConflictException with message", () => {
        const error = ErrorFactory.conflict("Resource conflict occurred");

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe("Resource conflict occurred");
      });
    });

    describe("alreadyExists", () => {
      it("should create ConflictException with entity and identifier", () => {
        const error = ErrorFactory.alreadyExists("User", "john@example.com");

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          "User with identifier john@example.com already exists",
        );
      });

      it("should create ConflictException with entity only", () => {
        const error = ErrorFactory.alreadyExists("Record");

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe("Record already exists");
      });
    });

    describe("alreadyEnrolled", () => {
      it("should create ConflictException for already enrolled", () => {
        const error = ErrorFactory.alreadyEnrolled("EC-0123");

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe("Already enrolled in EC Standard EC-0123");
      });
    });

    describe("duplicateEntry", () => {
      it("should create ConflictException for duplicate entry", () => {
        const error = ErrorFactory.duplicateEntry("email", "test@example.com");

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe("Duplicate email: test@example.com");
      });
    });
  });

  // ============================================
  // Authorization Errors
  // ============================================
  describe("Authorization Errors", () => {
    describe("unauthorized", () => {
      it("should create UnauthorizedException with custom message", () => {
        const error = ErrorFactory.unauthorized("Custom unauthorized message");

        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe("Custom unauthorized message");
      });

      it("should create UnauthorizedException with default message", () => {
        const error = ErrorFactory.unauthorized();

        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe("Unauthorized");
      });
    });

    describe("invalidCredentials", () => {
      it("should create UnauthorizedException for invalid credentials", () => {
        const error = ErrorFactory.invalidCredentials();

        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe("Invalid credentials");
      });
    });

    describe("tokenExpired", () => {
      it("should create UnauthorizedException for expired token", () => {
        const error = ErrorFactory.tokenExpired();

        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe("Token has expired");
      });
    });

    describe("forbidden", () => {
      it("should create ForbiddenException with custom message", () => {
        const error = ErrorFactory.forbidden("Custom forbidden message");

        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe("Custom forbidden message");
      });

      it("should create ForbiddenException with default message", () => {
        const error = ErrorFactory.forbidden();

        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe("Access denied");
      });
    });

    describe("insufficientPermissions", () => {
      it("should create ForbiddenException for insufficient permissions", () => {
        const error = ErrorFactory.insufficientPermissions("delete users");

        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe("Insufficient permissions to delete users");
      });
    });

    describe("tenantMismatch", () => {
      it("should create ForbiddenException for tenant mismatch", () => {
        const error = ErrorFactory.tenantMismatch();

        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe("Access denied: tenant mismatch");
      });
    });
  });

  // ============================================
  // Server Errors
  // ============================================
  describe("Server Errors", () => {
    describe("internalError", () => {
      it("should create InternalServerErrorException with custom message", () => {
        const error = ErrorFactory.internalError("Something went wrong");

        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe("Something went wrong");
      });

      it("should create InternalServerErrorException with default message", () => {
        const error = ErrorFactory.internalError();

        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe("An unexpected error occurred");
      });
    });

    describe("serviceUnavailable", () => {
      it("should create InternalServerErrorException for unavailable service", () => {
        const error = ErrorFactory.serviceUnavailable("Payment");

        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe("Payment service is unavailable");
      });
    });

    describe("databaseError", () => {
      it("should create InternalServerErrorException for database error", () => {
        const error = ErrorFactory.databaseError("insert");

        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe("Database error during insert");
      });
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("Edge Cases", () => {
    it("should handle empty string identifiers", () => {
      const error = ErrorFactory.notFound("User", "");

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe("User not found");
    });

    it("should handle zero as numeric identifier", () => {
      const error = ErrorFactory.notFound("Record", 0);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe("Record not found");
    });

    it("should handle special characters in messages", () => {
      const error = ErrorFactory.badRequest(
        "Invalid input: <script>alert('xss')</script>",
      );

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(
        "Invalid input: <script>alert('xss')</script>",
      );
    });

    it("should handle unicode characters", () => {
      const error = ErrorFactory.notFound("Usuário", "josé-123");

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe("Usuário with ID josé-123 not found");
    });

    it("should handle very long identifiers", () => {
      const longId = "a".repeat(1000);
      const error = ErrorFactory.userNotFound(longId);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe(`User ${longId} not found`);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { JanuaEmailService } from "./janua-email.service";

describe("JanuaEmailService", () => {
  let service: JanuaEmailService;
  let httpService: jest.Mocked<HttpService>;

  const mockConfig = {
    JANUA_API_URL: "https://api.janua.dev",
    JANUA_INTERNAL_API_KEY: "test-api-key",
    NEXT_PUBLIC_APP_URL: "https://app.avala.studio",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JanuaEmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, defaultValue?: string) =>
                mockConfig[key] ?? defaultValue,
            ),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JanuaEmailService>(JanuaEmailService);
    httpService = module.get(HttpService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("checkHealth", () => {
    it("should return true when service is healthy", async () => {
      httpService.get.mockReturnValue(
        of({ data: { status: "healthy" } } as any),
      );

      const result = await service.checkHealth();

      expect(result).toBe(true);
      expect(service.available).toBe(true);
    });

    it("should return false when service is unavailable", async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error("Connection failed")),
      );

      const result = await service.checkHealth();

      expect(result).toBe(false);
      expect(service.available).toBe(false);
    });
  });

  describe("sendEmail", () => {
    it("should send email successfully", async () => {
      httpService.post.mockReturnValue(
        of({
          data: { success: true, message_id: "msg-123" },
        } as any),
      );

      const result = await service.sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.message_id).toBe("msg-123");
    });

    it("should handle multiple recipients", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const result = await service.sendEmail({
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
    });

    it("should return error on failure", async () => {
      httpService.post.mockReturnValue(
        throwError(() => ({
          response: { data: { detail: "Invalid email" } },
        })),
      );

      const result = await service.sendEmail({
        to: "invalid",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendTemplateEmail", () => {
    it("should send template email successfully", async () => {
      httpService.post.mockReturnValue(
        of({ data: { success: true, message_id: "msg-456" } } as any),
      );

      const result = await service.sendTemplateEmail({
        to: "test@example.com",
        template: "auth/welcome",
        variables: { user_name: "Test User" },
      });

      expect(result.success).toBe(true);
    });

    it("should include attachments if provided", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const result = await service.sendTemplateEmail({
        to: "test@example.com",
        template: "transactional/certificate",
        variables: { certificate_name: "Test" },
        attachments: [
          {
            filename: "test.pdf",
            content: "base64content",
            content_type: "application/pdf",
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const result = await service.sendWelcomeEmail(
        "user@example.com",
        "John",
        "Acme Corp",
      );

      expect(result.success).toBe(true);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining("/send-template"),
        expect.objectContaining({
          template: "auth/welcome",
          variables: expect.objectContaining({
            user_name: "John",
            app_name: "Acme Corp",
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe("sendEnrollmentEmail", () => {
    it("should send enrollment confirmation email", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const result = await service.sendEnrollmentEmail(
        "user@example.com",
        "Maria",
        "Competencia EC0249",
        "EC0249",
        40,
      );

      expect(result.success).toBe(true);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining("/send"),
        expect.objectContaining({
          subject: expect.stringContaining("Inscripción Confirmada"),
        }),
        expect.any(Object),
      );
    });
  });

  describe("sendCertificateEmail", () => {
    it("should send certificate email with PDF attachment", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const pdfBuffer = Buffer.from("fake pdf content");
      const result = await service.sendCertificateEmail(
        "user@example.com",
        "Carlos",
        "Competencia EC0249",
        "DC3-2024-001",
        pdfBuffer,
      );

      expect(result.success).toBe(true);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining("/send-template"),
        expect.objectContaining({
          template: "transactional/certificate",
          variables: expect.objectContaining({
            certificate_name: expect.stringContaining("Constancia DC-3"),
            recipient_name: "Carlos",
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email", async () => {
      httpService.post.mockReturnValue(of({ data: { success: true } } as any));

      const result = await service.sendPasswordResetEmail(
        "user@example.com",
        "Ana",
        "reset-token-123",
      );

      expect(result.success).toBe(true);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining("/send-template"),
        expect.objectContaining({
          template: "auth/password-reset",
          variables: expect.objectContaining({
            user_name: "Ana",
            reset_link: expect.stringContaining("reset-token-123"),
          }),
        }),
        expect.any(Object),
      );
    });
  });
});

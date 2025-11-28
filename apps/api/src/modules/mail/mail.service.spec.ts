import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('MailService', () => {
  let service: MailService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        SMTP_HOST: 'localhost',
        SMTP_PORT: 1025,
        SMTP_FROM: '"Test" <test@example.com>',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      await expect(
        service.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        }),
      ).resolves.not.toThrow();
    });

    it('should send email with attachments', async () => {
      await expect(
        service.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test content</p>',
          attachments: [
            {
              filename: 'test.pdf',
              content: Buffer.from('test'),
              contentType: 'application/pdf',
            },
          ],
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      await expect(
        service.sendWelcomeEmail({
          email: 'user@example.com',
          firstName: 'John',
          tenantName: 'Test Tenant',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('sendEnrollmentEmail', () => {
    it('should send enrollment email', async () => {
      await expect(
        service.sendEnrollmentEmail({
          email: 'user@example.com',
          firstName: 'John',
          courseTitle: 'Test Course',
          courseCode: 'TC001',
          durationHours: 40,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('sendCertificateEmail', () => {
    it('should send certificate email with PDF attachment', async () => {
      const pdfBuffer = Buffer.from('mock-pdf-content');

      await expect(
        service.sendCertificateEmail({
          email: 'user@example.com',
          firstName: 'John',
          courseTitle: 'Test Course',
          folio: 'DC3-2024-001',
          pdfBuffer,
        }),
      ).resolves.not.toThrow();
    });
  });
});

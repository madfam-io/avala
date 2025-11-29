import { Test, TestingModule } from "@nestjs/testing";
import { CredentialsController } from "./credentials.controller";
import { OpenBadgeService } from "./open-badge.service";
import { CredentialStatusDto, AchievementType } from "./dto/open-badge.dto";

describe("CredentialsController", () => {
  let controller: CredentialsController;
  let openBadgeService: jest.Mocked<OpenBadgeService>;

  const mockOpenBadgeService = {
    issue: jest.fn(),
    bulkIssue: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByTrainee: jest.fn(),
    verify: jest.fn(),
    revoke: jest.fn(),
    getCredentialPayload: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [
        { provide: OpenBadgeService, useValue: mockOpenBadgeService },
      ],
    }).compile();

    controller = module.get<CredentialsController>(CredentialsController);
    openBadgeService = module.get(OpenBadgeService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // BADGE ISSUANCE TESTS
  // ============================================

  describe("issueBadge", () => {
    it("should issue a badge", async () => {
      const dto = {
        tenantId: "tenant-1",
        traineeId: "trainee-1",
        achievement: {
          name: "Course Completion",
          achievementType: AchievementType.Course,
        },
      };
      const mockResponse = {
        id: "cred-1",
        tenantId: "tenant-1",
        traineeId: "trainee-1",
        type: "OBV3",
        status: CredentialStatusDto.ACTIVE,
        issuedAt: new Date(),
        credential: {},
      };
      openBadgeService.issue.mockResolvedValue(mockResponse as any);

      const result = await controller.issueBadge(dto as any);

      expect(openBadgeService.issue).toHaveBeenCalledWith(dto);
      expect(result.id).toBe("cred-1");
      expect(result.status).toBe(CredentialStatusDto.ACTIVE);
    });
  });

  describe("bulkIssueBadge", () => {
    it("should bulk issue badges", async () => {
      const dto = {
        tenantId: "tenant-1",
        traineeIds: ["trainee-1", "trainee-2"],
        achievement: { name: "Training Complete" },
      };
      const mockResponse = {
        issued: [{ id: "cred-1" }, { id: "cred-2" }],
        errors: [],
      };
      openBadgeService.bulkIssue.mockResolvedValue(mockResponse as any);

      const result = await controller.bulkIssueBadge(dto as any);

      expect(openBadgeService.bulkIssue).toHaveBeenCalledWith(dto);
      expect(result.issued).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for failed issuances", async () => {
      const dto = {
        tenantId: "tenant-1",
        traineeIds: ["trainee-1", "invalid-id"],
        achievement: { name: "Training Complete" },
      };
      const mockResponse = {
        issued: [{ id: "cred-1" }],
        errors: [{ traineeId: "invalid-id", error: "Trainee not found" }],
      };
      openBadgeService.bulkIssue.mockResolvedValue(mockResponse as any);

      const result = await controller.bulkIssueBadge(dto as any);

      expect(result.issued).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].traineeId).toBe("invalid-id");
    });
  });

  // ============================================
  // QUERY TESTS
  // ============================================

  describe("listCredentials", () => {
    it("should list credentials with pagination", async () => {
      const query = { tenantId: "tenant-1", page: 1, limit: 10 };
      const mockResponse = {
        data: [{ id: "cred-1" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      openBadgeService.findAll.mockResolvedValue(mockResponse as any);

      const result = await controller.listCredentials(query as any);

      expect(openBadgeService.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it("should filter by status", async () => {
      const query = {
        tenantId: "tenant-1",
        status: CredentialStatusDto.ACTIVE,
      };
      openBadgeService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      } as any);

      await controller.listCredentials(query as any);

      expect(openBadgeService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe("getStatistics", () => {
    it("should get statistics for tenant", async () => {
      const mockStats = {
        total: 100,
        active: 85,
        revoked: 10,
        expired: 5,
        byType: [{ type: "Course", count: 100 }],
        byMonth: [{ month: 1, count: 10 }],
      };
      openBadgeService.getStatistics.mockResolvedValue(mockStats as any);

      const result = await controller.getStatistics("tenant-1", 2024);

      expect(openBadgeService.getStatistics).toHaveBeenCalledWith(
        "tenant-1",
        2024,
      );
      expect(result.total).toBe(100);
      expect(result.active).toBe(85);
    });

    it("should get statistics without year (defaults to current)", async () => {
      openBadgeService.getStatistics.mockResolvedValue({
        total: 50,
        active: 50,
        revoked: 0,
        expired: 0,
        byType: [],
        byMonth: [],
      } as any);

      await controller.getStatistics("tenant-1");

      expect(openBadgeService.getStatistics).toHaveBeenCalledWith(
        "tenant-1",
        undefined,
      );
    });
  });

  describe("getByTrainee", () => {
    it("should get credentials for trainee", async () => {
      const mockCredentials = [
        { id: "cred-1", traineeId: "trainee-1" },
        { id: "cred-2", traineeId: "trainee-1" },
      ];
      openBadgeService.findByTrainee.mockResolvedValue(mockCredentials as any);

      const result = await controller.getByTrainee("tenant-1", "trainee-1");

      expect(openBadgeService.findByTrainee).toHaveBeenCalledWith(
        "tenant-1",
        "trainee-1",
      );
      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // VERIFICATION TESTS
  // ============================================

  describe("verifyCredential", () => {
    it("should verify valid credential", async () => {
      const mockVerification = {
        valid: true,
        credentialId: "cred-1",
        status: CredentialStatusDto.ACTIVE,
        message: "Credential is valid and verified.",
        achievementName: "Course Completion",
        recipientName: "John Doe",
        issuerName: "Test Org",
        issuedAt: new Date(),
      };
      openBadgeService.verify.mockResolvedValue(mockVerification as any);

      const result = await controller.verifyCredential("cred-1");

      expect(openBadgeService.verify).toHaveBeenCalledWith("cred-1");
      expect(result.valid).toBe(true);
      expect(result.status).toBe(CredentialStatusDto.ACTIVE);
    });

    it("should return invalid for revoked credential", async () => {
      const mockVerification = {
        valid: false,
        credentialId: "cred-1",
        status: CredentialStatusDto.REVOKED,
        message: "Credential has been revoked.",
      };
      openBadgeService.verify.mockResolvedValue(mockVerification as any);

      const result = await controller.verifyCredential("cred-1");

      expect(result.valid).toBe(false);
      expect(result.status).toBe(CredentialStatusDto.REVOKED);
    });

    it("should return invalid for expired credential", async () => {
      const mockVerification = {
        valid: false,
        credentialId: "cred-1",
        status: CredentialStatusDto.EXPIRED,
        message: "Credential has expired.",
      };
      openBadgeService.verify.mockResolvedValue(mockVerification as any);

      const result = await controller.verifyCredential("cred-1");

      expect(result.valid).toBe(false);
      expect(result.status).toBe(CredentialStatusDto.EXPIRED);
    });

    it("should return invalid for non-existent credential", async () => {
      const mockVerification = {
        valid: false,
        credentialId: "invalid-id",
        status: CredentialStatusDto.REVOKED,
        message: "Credential not found. The ID may be invalid.",
      };
      openBadgeService.verify.mockResolvedValue(mockVerification as any);

      const result = await controller.verifyCredential("invalid-id");

      expect(result.valid).toBe(false);
      expect(result.message).toContain("not found");
    });
  });

  // ============================================
  // CREDENTIAL DETAIL TESTS
  // ============================================

  describe("getById", () => {
    it("should get credential by ID", async () => {
      const mockCredential = {
        id: "cred-1",
        tenantId: "tenant-1",
        traineeId: "trainee-1",
        status: CredentialStatusDto.ACTIVE,
      };
      openBadgeService.findById.mockResolvedValue(mockCredential as any);

      const result = await controller.getById("cred-1");

      expect(openBadgeService.findById).toHaveBeenCalledWith("cred-1");
      expect(result.id).toBe("cred-1");
    });
  });

  describe("getPayload", () => {
    it("should get OBv3 JSON-LD payload", async () => {
      const mockPayload = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        ],
        id: "https://avala.studio/credentials/cred-1",
        type: ["VerifiableCredential", "OpenBadgeCredential"],
        issuer: { name: "Test Org" },
        issuanceDate: "2024-01-01T00:00:00Z",
        credentialSubject: {
          achievement: { name: "Course Completion" },
        },
      };
      openBadgeService.getCredentialPayload.mockResolvedValue(
        mockPayload as any,
      );

      const result = await controller.getPayload("cred-1");

      expect(openBadgeService.getCredentialPayload).toHaveBeenCalledWith(
        "cred-1",
      );
      expect(result["@context"]).toBeDefined();
      expect(result.type).toContain("OpenBadgeCredential");
    });
  });

  // ============================================
  // REVOCATION TESTS
  // ============================================

  describe("revokeCredential", () => {
    it("should revoke credential", async () => {
      const dto = { reason: "Issued in error" };
      const mockRevoked = {
        id: "cred-1",
        status: CredentialStatusDto.REVOKED,
        revokedAt: new Date(),
      };
      openBadgeService.revoke.mockResolvedValue(mockRevoked as any);

      const result = await controller.revokeCredential("cred-1", dto as any);

      expect(openBadgeService.revoke).toHaveBeenCalledWith("cred-1", dto);
      expect(result.status).toBe(CredentialStatusDto.REVOKED);
    });

    it("should include revocation notes", async () => {
      const dto = {
        reason: "Fraudulent application",
        notes: "Investigation reference: INV-123",
      };
      openBadgeService.revoke.mockResolvedValue({
        id: "cred-1",
        status: CredentialStatusDto.REVOKED,
      } as any);

      await controller.revokeCredential("cred-1", dto as any);

      expect(openBadgeService.revoke).toHaveBeenCalledWith("cred-1", dto);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { UserService } from "./user.service";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { Role } from "@avala/db";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("UserService", () => {
  let service: UserService;

  const mockTenantId = "tenant-123";
  const mockUserId = "user-456";

  const mockTenantClient = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockPrisma = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
    tenant: {
      findUnique: jest.fn(),
    },
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn(),
  };

  const mockUser = {
    id: mockUserId,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "TRAINEE" as Role,
    status: "ACTIVE",
    curp: "CURP123456",
    rfc: "RFC123456",
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    passwordHash: "hashed",
    ssoSubject: null,
    ssoProvider: null,
    metadata: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      mockTenantClient.user.count.mockResolvedValue(25);
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: [mockUser],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it("should filter by role", async () => {
      mockTenantClient.user.count.mockResolvedValue(5);
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll(mockTenantId, { role: "TRAINEE" as Role });

      expect(mockTenantClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: "TRAINEE" },
        }),
      );
    });

    it("should filter by status", async () => {
      mockTenantClient.user.count.mockResolvedValue(5);
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll(mockTenantId, { status: "ACTIVE" });

      expect(mockTenantClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "ACTIVE" },
        }),
      );
    });

    it("should search by email, firstName, lastName, or curp", async () => {
      mockTenantClient.user.count.mockResolvedValue(1);
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll(mockTenantId, { search: "john" });

      expect(mockTenantClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: "john", mode: "insensitive" } },
              { firstName: { contains: "john", mode: "insensitive" } },
              { lastName: { contains: "john", mode: "insensitive" } },
              { curp: { contains: "john", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockTenantClient.user.count.mockResolvedValue(5);
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll(mockTenantId);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return user by ID", async () => {
      mockTenantClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockTenantId, mockUserId);

      expect(result).toEqual(mockUser);
      expect(mockTenantClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockTenantClient.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockTenantId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByEmail", () => {
    it("should return user by email", async () => {
      mockTenantClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(
        mockTenantId,
        "test@example.com",
      );

      expect(result).toEqual(mockUser);
      expect(mockTenantClient.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: mockTenantId,
            email: "test@example.com",
          },
        },
      });
    });

    it("should return null if user not found", async () => {
      mockTenantClient.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail(
        mockTenantId,
        "notfound@example.com",
      );

      expect(result).toBeNull();
    });
  });

  describe("findByRole", () => {
    it("should return users by role", async () => {
      mockTenantClient.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findByRole(mockTenantId, "TRAINEE" as Role);

      expect(result).toEqual([mockUser]);
      expect(mockTenantClient.user.findMany).toHaveBeenCalledWith({
        where: { role: "TRAINEE" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("create", () => {
    const createData = {
      email: "new@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
      role: "TRAINEE" as Role,
    };

    beforeEach(() => {
      mockTenantClient.user.findUnique.mockResolvedValue(null);
      mockTenantClient.user.create.mockResolvedValue({
        ...mockUser,
        email: createData.email,
        firstName: createData.firstName,
        lastName: createData.lastName,
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({ name: "Test Tenant" });
    });

    it("should create a new user", async () => {
      const result = await service.create(mockTenantId, createData);

      expect(result.email).toBe(createData.email);
      expect(mockTenantClient.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });

    it("should throw ConflictException if email already exists", async () => {
      // First call for email check returns existing user
      mockTenantClient.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.create(mockTenantId, createData)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if CURP already exists", async () => {
      // First call for email returns null, second for CURP returns user
      mockTenantClient.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockUser); // CURP check

      await expect(
        service.create(mockTenantId, { ...createData, curp: "EXISTING_CURP" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should generate random password if not provided", async () => {
      mockTenantClient.user.findUnique.mockResolvedValue(null);

      await service.create(mockTenantId, {
        email: "new@example.com",
        role: "TRAINEE" as Role,
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      const [password] = (bcrypt.hash as jest.Mock).mock.calls[0];
      expect(password.length).toBeGreaterThanOrEqual(12);
    });

    it("should send welcome email", async () => {
      await service.create(mockTenantId, createData);

      expect(mockMailService.sendWelcomeEmail).toHaveBeenCalledWith({
        email: createData.email,
        firstName: createData.firstName,
        tenantName: "Test Tenant",
      });
    });

    it("should not fail if welcome email fails", async () => {
      mockMailService.sendWelcomeEmail.mockRejectedValue(
        new Error("Email failed"),
      );

      const result = await service.create(mockTenantId, createData);

      expect(result.email).toBe(createData.email);
    });
  });

  describe("update", () => {
    it("should update user", async () => {
      mockTenantClient.user.update.mockResolvedValue({
        ...mockUser,
        firstName: "Updated",
      });

      const result = await service.update(mockTenantId, mockUserId, {
        firstName: "Updated",
      });

      expect(result.firstName).toBe("Updated");
      expect(mockTenantClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { firstName: "Updated" },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockTenantClient.user.update.mockRejectedValue(new Error("Not found"));

      await expect(
        service.update(mockTenantId, mockUserId, { firstName: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should soft delete user by setting status to INACTIVE", async () => {
      mockTenantClient.user.update.mockResolvedValue({
        ...mockUser,
        status: "INACTIVE",
      });

      const result = await service.delete(mockTenantId, mockUserId);

      expect(result.status).toBe("INACTIVE");
      expect(mockTenantClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { status: "INACTIVE" },
      });
    });
  });

  describe("countByRole", () => {
    it("should return count by role", async () => {
      mockTenantClient.user.groupBy.mockResolvedValue([
        { role: "TRAINEE", _count: 10 },
        { role: "INSTRUCTOR", _count: 5 },
        { role: "ADMIN", _count: 2 },
      ]);

      const result = await service.countByRole(mockTenantId);

      expect(result).toEqual({
        TRAINEE: 10,
        INSTRUCTOR: 5,
        ADMIN: 2,
      });
    });
  });
});

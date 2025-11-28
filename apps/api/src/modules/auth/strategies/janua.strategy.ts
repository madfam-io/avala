import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database/prisma.service";

interface JanuaJwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  januaSub?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JanuaStrategy extends PassportStrategy(Strategy, "janua-jwt") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow("JWT_SECRET"),
    });
  }

  async validate(payload: JanuaJwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.tenant || user.tenant.status !== "ACTIVE") {
      throw new UnauthorizedException("Tenant is inactive");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
      januaSub: payload.januaSub,
    };
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';

interface StaffAccess {
  role?: string;
  anyOf: string[][];
}

export type StaffRequest = Request & {
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: Record<string, boolean>;
  };
};

const StaffAccessRule = Reflector.createDecorator<StaffAccess>();
const PublicAccess = Reflector.createDecorator<boolean>();

export const PublicRoute = () => PublicAccess(true);

export const RequireStaff = (...anyOf: string[][]) =>
  StaffAccessRule({ anyOf });

export const RequireAdministrator = (...permissions: string[]) =>
  StaffAccessRule({ role: 'ADMIN', anyOf: [permissions] });

@Injectable()
export class StaffAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.getAllAndOverride(StaffAccessRule, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (this.reflector.get(PublicAccess, context.getHandler())) return true;
    if (!access) throw new ForbiddenException();

    const http = context.switchToHttp();
    const request = http.getRequest<StaffRequest>();
    const token = /^Bearer (\S+)$/i.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) throw new UnauthorizedException();

    let subject: unknown;
    let sessionVersion: unknown;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; sv?: unknown }>(token);
      subject = payload.sub;
      sessionVersion = payload.sv;
    } catch {
      throw new UnauthorizedException();
    }
    if (typeof subject !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(subject) ||
        !Number.isInteger(sessionVersion)) {
      throw new UnauthorizedException();
    }

    const user = await this.users.findForSession(subject);
    if (!user || user.enabled !== 1 || user.deleted !== 0 || user.sessionVersion !== sessionVersion) {
      throw new UnauthorizedException();
    }

    const role = user.roleCode
      ? await this.roles.findByCode(user.roleCode)
      : null;
    if (
      role?.enabled !== 1 || role.deleted !== 0 ||
      (access.role && role.code !== access.role) ||
      !access.anyOf.some((permissions) =>
        permissions.every(
          (permission) => role.permissions?.[permission] === true,
        ),
      )
    ) {
      throw new ForbiddenException();
    }
    request.staff = {
      id: subject,
      name: user.name,
      email: user.email,
      role: role.code,
      permissions: role.permissions ?? {},
    };
    http
      .getResponse<Response>()
      .setHeader('Cache-Control', 'private, no-store');
    return true;
  }
}

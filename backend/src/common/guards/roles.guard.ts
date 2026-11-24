import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AppRole, RequestWithUser } from '../types/authenticated-user.js';

/**
 * Authorization: what may you do? Rejects users without the required role (403).
 * Reads the role from the database, so removing a role takes effect immediately.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowedRoles) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user) throw new UnauthorizedException('Please log in.');

    const role = await this.usersService.getRole(user);
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('You do not have access to this.');
    }
    return true;
  }
}

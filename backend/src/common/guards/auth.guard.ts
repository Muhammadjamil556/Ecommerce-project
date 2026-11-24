import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { RequestWithUser } from '../types/authenticated-user.js';

/** Authentication: who are you? Rejects requests without a valid token (401). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const accessToken = getBearerToken(request.headers.authorization);
    if (!accessToken) throw new UnauthorizedException('Please log in.');

    request.user = await this.supabase.verifyAccessToken(accessToken);
    return true;
  }
}

function getBearerToken(header: string | undefined): string | null {
  return header?.match(/^Bearer (\S+)$/i)?.[1] ?? null;
}

import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { RequestWithUser } from '../types/authenticated-user.js';

/** Gives a controller the logged-in user. Never read the user ID from the request body. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user) throw new UnauthorizedException('Please log in.');
    return user;
  },
);

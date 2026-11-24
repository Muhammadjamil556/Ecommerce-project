import type { Request } from 'express';

export type AppRole = 'customer' | 'admin';

/** Who is making the request, taken from the verified token. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  accessToken: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

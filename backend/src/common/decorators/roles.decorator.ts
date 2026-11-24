import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '../types/authenticated-user.js';

export const ROLES_KEY = 'roles';

/** Allows only users who have one of these roles. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from './roles.decorator.js';

/** Allows admins only, and documents that in Swagger. */
export function AdminOnly() {
  return applyDecorators(
    Roles('admin'),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Not logged in' }),
    ApiForbiddenResponse({ description: 'Not an admin' }),
  );
}

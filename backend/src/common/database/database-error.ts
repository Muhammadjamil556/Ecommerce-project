import { BadRequestException, ConflictException } from '@nestjs/common';

interface DatabaseError {
  code: string;
  message: string;
}

interface ConflictMessages {
  /** A unique value, such as a slug, is already used. */
  duplicate?: string;
  /** A related row is missing, or still refers to this one. */
  reference?: string;
}

/** Turns expected database errors into 4xx answers. Anything else becomes a 500. */
export function toHttpError(
  error: DatabaseError,
  action: string,
  messages: ConflictMessages = {},
): Error {
  switch (error.code) {
    case '23505':
      return new ConflictException(messages.duplicate ?? 'Already exists.');
    case '23503':
    case '23001':
      return new ConflictException(
        messages.reference ?? 'Related data prevents this.',
      );
    case '23502':
    case '23514':
      return new BadRequestException('A value is not allowed.');
    default:
      return new Error(`${action} failed: ${error.message}`);
  }
}

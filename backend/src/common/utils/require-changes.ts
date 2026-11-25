import { BadRequestException } from '@nestjs/common';

/** Keeps only the fields the client sent. Rejects an update that changes nothing. */
export function requireChanges(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const changes = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(changes).length === 0) {
    throw new BadRequestException('Send at least one field to change.');
  }
  return changes;
}

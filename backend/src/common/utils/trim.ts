import type { TransformFnParams } from 'class-transformer';

/** For @Transform(trim): removes spaces around text before it is validated. */
export function trim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

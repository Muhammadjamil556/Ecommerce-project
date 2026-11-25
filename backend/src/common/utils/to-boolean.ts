import type { TransformFnParams } from 'class-transformer';

/** For @Transform(toBoolean): query values arrive as text. */
export function toBoolean({ value }: TransformFnParams): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

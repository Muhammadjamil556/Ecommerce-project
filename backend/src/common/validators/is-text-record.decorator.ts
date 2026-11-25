import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

interface Limits {
  maxEntries: number;
  maxKeyLength: number;
  maxValueLength: number;
}

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function isTextRecord(value: unknown, limits: Limits): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= limits.maxEntries &&
    entries.every(
      ([key, text]) =>
        key.trim().length > 0 &&
        key.length <= limits.maxKeyLength &&
        !UNSAFE_KEYS.has(key) &&
        typeof text === 'string' &&
        text.trim().length > 0 &&
        text.length <= limits.maxValueLength,
    )
  );
}

/** An object whose values are all text, such as { "Color": "Black" }. */
export function IsTextRecord(limits: Limits, options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isTextRecord',
      constraints: [limits],
      validator: {
        validate: (value): boolean => isTextRecord(value, limits),
        defaultMessage: buildMessage(
          (prefix) =>
            `${prefix}$property must be an object of at most ${limits.maxEntries} text values`,
          options,
        ),
      },
    },
    options,
  );
}

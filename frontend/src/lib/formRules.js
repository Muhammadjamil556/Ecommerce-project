import { z } from 'zod'

/** Blank is allowed for new items: the API makes the slug from the name. */
export function optionalSlug(max) {
  return z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*)?$/,
      'Use lowercase letters, numbers and single hyphens',
    )
}

export function requiredText(label, max) {
  return z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .max(max, `Use at most ${max} characters`)
}

/** A whole number from 0 to 10,000, typed as text. */
export const sortOrderRule = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/, 'Enter a whole number, 0 or more')
  .refine((text) => Number(text) <= 10_000, 'Use at most 10000')

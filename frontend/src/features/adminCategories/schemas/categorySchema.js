import { z } from 'zod'
import { optionalSlug, requiredText, sortOrderRule } from '@/lib/formRules'

export const categorySchema = z.object({
  name: requiredText('a name', 80),
  slug: optionalSlug(100),
  description: z.string().trim().max(500, 'Use at most 500 characters'),
  sortOrder: sortOrderRule,
  isActive: z.boolean(),
})

export function toCategoryForm(category) {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
  }
}

export function toCategoryPayload({ slug, sortOrder, ...values }) {
  return {
    ...values,
    sortOrder: Number(sortOrder),
    ...(slug ? { slug } : {}),
  }
}

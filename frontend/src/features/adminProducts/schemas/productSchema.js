import { z } from 'zod'
import { optionalSlug, requiredText } from '@/lib/formRules'
import { fromTextRows, textRowsRule, toTextRows } from './textRows'

export const productSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  name: requiredText('a name', 150),
  slug: optionalSlug(180),
  brand: requiredText('a brand', 60),
  description: z.string().trim().max(5000, 'Use at most 5000 characters'),
  specifications: textRowsRule({ maxRows: 40, maxName: 60, maxValue: 300 }),
})

export function toProductForm(product) {
  return {
    categoryId: product?.category.id ?? '',
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    brand: product?.brand ?? '',
    description: product?.description ?? '',
    specifications: toTextRows(product?.specifications),
  }
}

export function toProductPayload({ slug, specifications, ...values }) {
  return {
    ...values,
    specifications: fromTextRows(specifications),
    ...(slug ? { slug } : {}),
  }
}

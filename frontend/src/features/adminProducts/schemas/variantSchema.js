import { z } from 'zod'
import { requiredText, sortOrderRule } from '@/lib/formRules'
import { parsePrice, toPriceInput } from '@/lib/money'
import { fromTextRows, textRowsRule, toTextRows } from './textRows'

export const variantSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Enter an SKU')
    .max(60, 'Use at most 60 characters')
    .regex(
      /^([A-Z0-9]+(-[A-Z0-9]+)*)?$/,
      'Use letters, numbers and single hyphens',
    ),
  name: requiredText('a name', 100),
  price: z
    .string()
    .refine(
      (text) => parsePrice(text) !== null,
      'Enter a price in rupees, such as 45000 or 45000.50',
    ),
  options: textRowsRule({ maxRows: 5, maxName: 40, maxValue: 80 }),
  sortOrder: sortOrderRule,
  isActive: z.boolean(),
})

export function toVariantForm(variant) {
  return {
    sku: variant?.sku ?? '',
    name: variant?.name ?? '',
    price: variant ? toPriceInput(variant.priceMinor) : '',
    options: toTextRows(variant?.options),
    sortOrder: String(variant?.sortOrder ?? 0),
    isActive: variant?.isActive ?? true,
  }
}

export function toVariantPayload({ price, options, sortOrder, ...values }) {
  return {
    ...values,
    priceMinor: parsePrice(price),
    options: fromTextRows(options),
    sortOrder: Number(sortOrder),
  }
}

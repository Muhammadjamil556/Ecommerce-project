import { z } from 'zod'

const MAX_AMOUNT = 100_000

const wholeNumber = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/, 'Enter a whole number')
  .refine((text) => Number(text) <= MAX_AMOUNT, 'Use at most 100000')

export const adjustSchema = z.object({
  direction: z.enum(['add', 'remove']),
  amount: wholeNumber.refine((text) => Number(text) > 0, 'Enter at least 1'),
  reason: z.string().min(1, 'Choose a reason'),
  note: z.string().trim().max(300, 'Use at most 300 characters'),
})

export const thresholdSchema = z.object({ lowStockThreshold: wholeNumber })

export function toAdjustPayload({ direction, amount, reason, note }) {
  const change = direction === 'remove' ? -Number(amount) : Number(amount)
  return { change, reason, ...(note ? { note } : {}) }
}

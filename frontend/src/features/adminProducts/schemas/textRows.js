import { z } from 'zod'

const UNSAFE_NAMES = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * A list of { name, value } rows, saved by the API as one object.
 * Rows left completely blank are ignored.
 */
export function textRowsRule({ maxRows, maxName, maxValue }) {
  const row = z.object({
    name: z.string().trim().max(maxName, `Use at most ${maxName} characters`),
    value: z
      .string()
      .trim()
      .max(maxValue, `Use at most ${maxValue} characters`),
  })

  return z
    .array(row)
    .max(maxRows, `Use at most ${maxRows} rows`)
    .superRefine((rows, context) => {
      const seen = new Set()
      const report = (index, field, message) =>
        context.addIssue({ code: 'custom', path: [index, field], message })

      rows.forEach(({ name, value }, index) => {
        if (!name && !value) return
        if (!name) report(index, 'name', 'Enter a name')
        else if (UNSAFE_NAMES.has(name)) {
          report(index, 'name', 'This name cannot be used')
        } else if (seen.has(name)) {
          report(index, 'name', 'This name is already used')
        }
        if (!value) report(index, 'value', 'Enter a value')
        seen.add(name)
      })
    })
}

export function toTextRows(record) {
  return Object.entries(record ?? {}).map(([name, value]) => ({ name, value }))
}

export function fromTextRows(rows) {
  return Object.fromEntries(
    rows.filter(({ name }) => name).map(({ name, value }) => [name, value]),
  )
}

import { describe, expect, it } from 'vitest'
import { adjustSchema, thresholdSchema, toAdjustPayload } from './stockSchemas'

const valid = { direction: 'add', amount: '5', reason: 'received', note: ' ' }

describe('adjustSchema', () => {
  it('adds a positive change and leaves out a blank note', () => {
    expect(toAdjustPayload(adjustSchema.parse(valid))).toEqual({
      change: 5,
      reason: 'received',
    })
  })

  it('removes with a negative change', () => {
    const values = { ...valid, direction: 'remove', note: ' Broken ' }
    expect(toAdjustPayload(adjustSchema.parse(values))).toEqual({
      change: -5,
      reason: 'received',
      note: 'Broken',
    })
  })

  it.each([
    ['amount', '0'],
    ['amount', '-5'],
    ['amount', '1.5'],
    ['amount', '1e3'],
    ['amount', '100001'],
    ['amount', ''],
    ['reason', ''],
  ])('rejects %s "%s"', (field, value) => {
    const result = adjustSchema.safeParse({ ...valid, [field]: value })
    expect(result.error.issues[0].path).toEqual([field])
  })
})

describe('thresholdSchema', () => {
  it('allows 0 and rejects a negative level', () => {
    const check = (lowStockThreshold) =>
      thresholdSchema.safeParse({ lowStockThreshold }).success
    expect(check('0')).toBe(true)
    expect(check('-1')).toBe(false)
  })
})

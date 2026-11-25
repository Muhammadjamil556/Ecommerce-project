import { describe, expect, it } from 'vitest'
import { pickChanges } from './pickChanges'

describe('pickChanges', () => {
  it('keeps only changed fields', () => {
    expect(pickChanges({ a: 1, b: '' }, { a: 1, b: 'x' })).toEqual({ b: 'x' })
  })

  it('treats a missing field as changed', () => {
    expect(pickChanges({}, { a: false })).toEqual({ a: false })
  })

  it('ignores the order of keys inside an object', () => {
    const before = { specs: { Weight: '1 g', Color: 'Black' } }
    const after = { specs: { Color: 'Black', Weight: '1 g' } }
    expect(pickChanges(before, after)).toEqual({})
  })

  it('notices a changed or removed key inside an object', () => {
    const before = { specs: { Weight: '1 g', Color: 'Black' } }
    expect(pickChanges(before, { specs: { Weight: '1 g' } })).toEqual({
      specs: { Weight: '1 g' },
    })
  })
})

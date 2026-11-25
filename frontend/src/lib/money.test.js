import { describe, expect, it } from 'vitest'
import { formatPrice, parsePrice, toPriceInput } from './money'

describe('formatPrice', () => {
  it.each([
    [99999900, 'Rs 999,999'],
    [4500050, 'Rs 45,000.50'],
    [1, 'Rs 0.01'],
  ])('shows %i paisa as %s', (paisa, text) => {
    expect(formatPrice(paisa)).toBe(text)
  })
})

describe('parsePrice', () => {
  it.each([
    ['45000', 4500000],
    [' 999,999.50 ', 99999950],
    ['0.01', 1],
    ['1.1', 110],
    // Decimals cannot hold this exactly: 1.15 * 100 is 114.99999999999999.
    ['1.15', 115],
    ['21474836.47', 2147483647],
  ])('reads "%s" as %i paisa', (text, paisa) => {
    expect(parsePrice(text)).toBe(paisa)
  })

  it.each(['', '0', '-5', 'abc', '1.234', '1e5', '21474836.48', '.5', '5.'])(
    'rejects "%s"',
    (text) => {
      expect(parsePrice(text)).toBeNull()
    },
  )

  it.each([1, 100, 110, 4500050, 2147483647])(
    'reads back what toPriceInput wrote for %i',
    (paisa) => {
      expect(parsePrice(toPriceInput(paisa))).toBe(paisa)
    },
  )
})

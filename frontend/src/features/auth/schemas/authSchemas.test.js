import { describe, expect, it } from 'vitest'
import { registerSchema, resetPasswordSchema } from './authSchemas'

const valid = {
  fullName: '  Ann ',
  email: 'ann@example.com',
  password: 'Long-enough1',
  confirmPassword: 'Long-enough1',
}

describe('registerSchema', () => {
  it('accepts valid input and trims the name', () => {
    expect(registerSchema.parse(valid).fullName).toBe('Ann')
  })

  it.each([
    ['fullName', { fullName: '   ' }],
    ['email', { email: 'ann' }],
    ['password', { password: 'short', confirmPassword: 'short' }],
    ['confirmPassword', { confirmPassword: 'different' }],
  ])('rejects an invalid %s', (field, change) => {
    const result = registerSchema.safeParse({ ...valid, ...change })
    expect(result.error.issues.map((issue) => issue.path[0])).toContain(field)
  })
})

describe('new password rules', () => {
  const parse = (password) =>
    resetPasswordSchema.safeParse({ password, confirmPassword: password })

  it.each([
    ['lowercase letter', 'LONG-ENOUGH1'],
    ['uppercase letter', 'long-enough1'],
    ['number', 'Long-enough'],
    ['symbol', 'LongEnough1'],
  ])('requires a %s', (rule, password) => {
    const result = parse(password)
    expect(result.error.issues).toHaveLength(1)
    expect(result.error.issues[0].message).toContain(rule)
  })

  it.each([...'!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~'])(
    'accepts %s as the symbol',
    (symbol) => {
      expect(parse(`LongEnough1${symbol}`).success).toBe(true)
    },
  )

  it('does not count a space or an accented letter as a symbol', () => {
    expect(parse('Long Enough1é').success).toBe(false)
  })
})

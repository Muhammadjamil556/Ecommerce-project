import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './authErrors'

describe('getAuthErrorMessage', () => {
  it.each([
    [{ code: 'invalid_credentials' }, 'Incorrect email or password.'],
    [{ name: 'AuthRetryableFetchError' }, 'Cannot reach the login service'],
    [{ code: 'unknown', message: 'internal detail' }, 'Something went wrong.'],
    [undefined, 'Something went wrong.'],
  ])('explains %o', (error, message) => {
    expect(getAuthErrorMessage(error)).toContain(message)
  })
})

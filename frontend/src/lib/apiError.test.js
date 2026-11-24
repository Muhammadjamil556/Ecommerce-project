import { describe, expect, it } from 'vitest'
import { toApiError } from '@/lib/apiError'

describe('toApiError', () => {
  it('uses the error sent by the API', () => {
    const error = {
      response: {
        status: 400,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: ['name must be a string'],
          },
        },
      },
    }

    expect(toApiError(error)).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: ['name must be a string'],
      status: 400,
    })
  })

  it.each([
    ['UNEXPECTED_RESPONSE', { response: { status: 502, data: '<html>' } }],
    ['TIMEOUT', { code: 'ECONNABORTED' }],
    ['NETWORK_ERROR', { code: 'ERR_NETWORK' }],
  ])('returns %s when there is no API error body', (code, error) => {
    expect(toApiError(error).code).toBe(code)
  })
})

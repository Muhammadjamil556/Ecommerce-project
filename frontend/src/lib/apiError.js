/**
 * Converts any Axios error into one plain shape the UI can display:
 * { code, message, details, status }
 */
export function toApiError(error) {
  const status = error?.response?.status ?? null
  const apiError = error?.response?.data?.error

  if (apiError?.message) {
    return {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details ?? [],
      status,
    }
  }

  if (status) {
    return {
      code: 'UNEXPECTED_RESPONSE',
      message: 'The server returned an unexpected response.',
      details: [],
      status,
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT',
      message: 'The server took too long to respond.',
      details: [],
      status,
    }
  }

  // No response at all: server stopped, wrong URL, no internet, or blocked by CORS.
  return {
    code: 'NETWORK_ERROR',
    message: 'Cannot reach the server.',
    details: [],
    status,
  }
}

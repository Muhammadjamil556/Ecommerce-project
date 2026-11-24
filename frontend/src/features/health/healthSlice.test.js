import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHealth } from './api/healthApi'
import healthReducer, { fetchHealth, selectHealth } from './healthSlice'

vi.mock('./api/healthApi', () => ({ getHealth: vi.fn() }))

describe('healthSlice', () => {
  let store

  beforeEach(() => {
    vi.mocked(getHealth).mockReset()
    store = configureStore({ reducer: { health: healthReducer } })
  })

  it('stores the response when the request succeeds', async () => {
    getHealth.mockResolvedValue({ status: 'ok' })

    const request = store.dispatch(fetchHealth())
    expect(selectHealth(store.getState()).status).toBe('loading')
    await request

    expect(selectHealth(store.getState())).toEqual({
      data: { status: 'ok' },
      status: 'succeeded',
      error: null,
    })
  })

  it('stores a readable error when the request fails', async () => {
    getHealth.mockRejectedValue({ code: 'ERR_NETWORK' })

    await store.dispatch(fetchHealth())

    const health = selectHealth(store.getState())
    expect(health.status).toBe('failed')
    expect(health.error.code).toBe('NETWORK_ERROR')
  })
})

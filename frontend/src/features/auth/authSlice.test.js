import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser } from './api/authApi'
import authReducer, {
  fetchCurrentUser,
  selectAuth,
  sessionEnded,
  sessionStarted,
} from './authSlice'

vi.mock('./api/authApi', () => ({ getCurrentUser: vi.fn() }))

describe('authSlice', () => {
  let store
  const auth = () => selectAuth(store.getState())

  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    store = configureStore({ reducer: { auth: authReducer } })
  })

  it('stores the user after login', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: 'customer' })

    store.dispatch(sessionStarted('1'))
    await store.dispatch(fetchCurrentUser('1'))

    expect(auth()).toMatchObject({
      status: 'authenticated',
      user: { id: '1', role: 'customer' },
    })
  })

  it('does not claim to be logged in when the API fails', async () => {
    getCurrentUser.mockRejectedValue({ code: 'ERR_NETWORK' })

    store.dispatch(sessionStarted('1'))
    await store.dispatch(fetchCurrentUser('1'))

    expect(auth()).toMatchObject({ status: 'failed', user: null })
  })

  it('ignores a response that arrives after logout', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: 'admin' })

    store.dispatch(sessionStarted('1'))
    const request = store.dispatch(fetchCurrentUser('1'))
    store.dispatch(sessionEnded())
    await request

    expect(auth()).toMatchObject({ status: 'anonymous', user: null })
  })
})

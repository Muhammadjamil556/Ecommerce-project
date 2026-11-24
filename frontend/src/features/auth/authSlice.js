import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toApiError } from '@/lib/apiError'
import { getCurrentUser } from './api/authApi'

/** Loads the profile and role from NestJS. The argument is the session's user ID. */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_userId, { rejectWithValue }) => {
    try {
      return await getCurrentUser()
    } catch (error) {
      return rejectWithValue(toApiError(error))
    }
  },
)

// The token is not stored here. supabase-js keeps and refreshes it.
const initialState = {
  // 'loading' | 'anonymous' | 'authenticated' | 'failed' (logged in, API unreachable)
  status: 'loading',
  sessionUserId: null,
  user: null,
  error: null,
  // True only after opening a password reset email link.
  isPasswordRecovery: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action) {
      state.sessionUserId = action.payload
    },
    sessionEnded() {
      return { ...initialState, status: 'anonymous' }
    },
    passwordRecoveryStarted(state) {
      state.isPasswordRecovery = true
    },
    passwordRecoveryFinished(state) {
      state.isPasswordRecovery = false
    },
  },
  extraReducers: (builder) => {
    // A response can arrive after the user logged out or switched accounts.
    const isCurrent = (state, action) => action.meta.arg === state.sessionUserId

    builder
      .addCase(fetchCurrentUser.pending, (state, action) => {
        if (!isCurrent(state, action)) return
        state.status = 'loading'
        state.user = null
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (!isCurrent(state, action)) return
        state.status = 'authenticated'
        state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (!isCurrent(state, action)) return
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const {
  sessionStarted,
  sessionEnded,
  passwordRecoveryStarted,
  passwordRecoveryFinished,
} = authSlice.actions

export const selectAuth = (state) => state.auth

export default authSlice.reducer

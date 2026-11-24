import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sessionEnded } from '@/features/auth/authSlice'
import { toApiError } from '@/lib/apiError'
import { getAdminSummary } from './api/adminApi'

export const fetchAdminSummary = createAsyncThunk(
  'admin/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await getAdminSummary()
    } catch (error) {
      return rejectWithValue(toApiError(error))
    }
  },
)

const initialState = {
  summary: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Do not leave admin data behind for the next person on this browser.
      .addCase(sessionEnded, () => initialState)
      .addCase(fetchAdminSummary.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminSummary.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.summary = action.payload
      })
      .addCase(fetchAdminSummary.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const selectAdmin = (state) => state.admin

export default adminSlice.reducer

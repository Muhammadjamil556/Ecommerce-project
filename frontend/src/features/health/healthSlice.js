import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toApiError } from '@/lib/apiError'
import { getHealth } from './api/healthApi'

export const fetchHealth = createAsyncThunk(
  'health/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await getHealth()
    } catch (error) {
      return rejectWithValue(toApiError(error))
    }
  },
)

const initialState = {
  data: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
}

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
      })
      .addCase(fetchHealth.rejected, (state, action) => {
        state.status = 'failed'
        state.data = null
        state.error = action.payload
      })
  },
})

export const selectHealth = (state) => state.health

export default healthSlice.reducer

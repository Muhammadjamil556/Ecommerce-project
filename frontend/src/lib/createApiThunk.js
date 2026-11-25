import { createAsyncThunk } from '@reduxjs/toolkit'
import { toApiError } from './apiError'

/** A thunk whose failure is always the plain error shape of toApiError. */
export function createApiThunk(type, request) {
  return createAsyncThunk(type, async (argument, { rejectWithValue }) => {
    try {
      return await request(argument)
    } catch (error) {
      return rejectWithValue(toApiError(error))
    }
  })
}

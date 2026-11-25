import { createSlice } from '@reduxjs/toolkit'
import { sessionEnded } from '@/features/auth/authSlice'
import { createApiThunk } from '@/lib/createApiThunk'
import * as api from './api/adminCategoriesApi'

export const fetchCategories = createApiThunk(
  'adminCategories/fetch',
  api.getCategories,
)
export const createCategory = createApiThunk(
  'adminCategories/create',
  api.createCategory,
)
export const updateCategory = createApiThunk(
  'adminCategories/update',
  api.updateCategory,
)
export const deleteCategory = createApiThunk(
  'adminCategories/delete',
  api.deleteCategory,
)

const initialState = {
  items: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  requestId: null,
}

// The same order as the API.
function inOrder(items) {
  return items.toSorted(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

const adminCategoriesSlice = createSlice({
  name: 'adminCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Only the newest request counts. After logout there is none.
    const isCurrent = (state, action) =>
      action.meta.requestId === state.requestId

    builder
      .addCase(sessionEnded, () => initialState)
      .addCase(fetchCategories.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.requestId = action.meta.requestId
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (!isCurrent(state, action)) return
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        if (!isCurrent(state, action)) return
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        if (!state.items) return
        state.items = inOrder([...state.items, action.payload])
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (!state.items) return
        state.items = inOrder(
          state.items.map((item) =>
            item.id === action.payload.id ? action.payload : item,
          ),
        )
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        if (!state.items) return
        state.items = state.items.filter((item) => item.id !== action.meta.arg)
      })
  },
})

export const selectAdminCategories = (state) => state.adminCategories

export default adminCategoriesSlice.reducer

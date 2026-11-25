import { createSlice } from '@reduxjs/toolkit'
import { sessionEnded } from '@/features/auth/authSlice'
import { createApiThunk } from '@/lib/createApiThunk'
import { addRequestCases, initialRequest } from '@/lib/requestState'
import * as api from './api/adminInventoryApi'

export const fetchInventory = createApiThunk(
  'adminInventory/fetchList',
  api.getInventory,
)
export const fetchInventoryItem = createApiThunk(
  'adminInventory/fetchOne',
  api.getInventoryItem,
)
export const fetchMovements = createApiThunk(
  'adminInventory/fetchMovements',
  api.getMovements,
)
export const adjustStock = createApiThunk(
  'adminInventory/adjust',
  api.adjustStock,
)
export const updateThreshold = createApiThunk(
  'adminInventory/updateThreshold',
  api.updateThreshold,
)

const initialState = {
  list: { items: null, meta: null, ...initialRequest },
  current: { item: null, ...initialRequest },
  history: { items: null, meta: null, ...initialRequest },
}

/** Shows the new numbers wherever this variant is on screen. */
function replaceItem(state, action) {
  const item = action.payload
  if (state.current.item?.variantId === item.variantId) {
    state.current.item = item
  }
  if (state.list.items) {
    state.list.items = state.list.items.map((other) =>
      other.variantId === item.variantId ? item : other,
    )
  }
}

const adminInventorySlice = createSlice({
  name: 'adminInventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sessionEnded, () => initialState)
      .addCase(adjustStock.fulfilled, replaceItem)
      .addCase(updateThreshold.fulfilled, replaceItem)

    addRequestCases(builder, fetchInventory, 'list', (list, payload) => {
      list.items = payload.items
      list.meta = payload.meta
    })
    addRequestCases(builder, fetchInventoryItem, 'current', (current, item) => {
      current.item = item
    })
    addRequestCases(builder, fetchMovements, 'history', (history, payload) => {
      history.items = payload.items
      history.meta = payload.meta
    })
  },
})

export const selectInventoryList = (state) => state.adminInventory.list
export const selectInventoryItem = (state) => state.adminInventory.current
export const selectMovements = (state) => state.adminInventory.history

export default adminInventorySlice.reducer

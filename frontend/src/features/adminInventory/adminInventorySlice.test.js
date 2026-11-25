import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionEnded } from '@/features/auth/authSlice'
import adminInventoryReducer, {
  adjustStock,
  fetchInventory,
  fetchInventoryItem,
  fetchMovements,
  selectInventoryItem,
  selectInventoryList,
  selectMovements,
} from './adminInventorySlice'
import * as api from './api/adminInventoryApi'

// The real clients need a browser.
vi.mock('@/lib/apiClient', () => ({ apiClient: {} }))
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }))
vi.mock('./api/adminInventoryApi')

const item = (variantId, quantity) => ({ variantId, quantity })

describe('adminInventorySlice', () => {
  let store
  const list = () => selectInventoryList(store.getState())
  const current = () => selectInventoryItem(store.getState())

  beforeEach(async () => {
    vi.resetAllMocks()
    store = configureStore({
      reducer: { adminInventory: adminInventoryReducer },
    })
    api.getInventory.mockResolvedValue({
      items: [item('a', 1), item('b', 2)],
      meta: {},
    })
    api.getInventoryItem.mockResolvedValue(item('a', 1))
    await store.dispatch(fetchInventory({}))
    await store.dispatch(fetchInventoryItem('a'))
  })

  it('shows the new stock in the list and on the open page', async () => {
    api.adjustStock.mockResolvedValue(item('a', 6))
    await store.dispatch(adjustStock({ variantId: 'a', values: {} }))
    expect(list().items).toEqual([item('a', 6), item('b', 2)])
    expect(current().item).toEqual(item('a', 6))
  })

  it('changes nothing when the change fails', async () => {
    api.adjustStock.mockRejectedValue(new Error('offline'))
    await store.dispatch(adjustStock({ variantId: 'a', values: {} }))
    expect(list().items[0]).toEqual(item('a', 1))
    expect(current().item).toEqual(item('a', 1))
  })

  it('keeps the newest history when answers arrive out of order', async () => {
    let finishFirst
    api.getMovements
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishFirst = () => resolve({ items: ['old'], meta: {} })
        }),
      )
      .mockResolvedValueOnce({ items: ['new'], meta: {} })

    const first = store.dispatch(fetchMovements({ variantId: 'a', page: 1 }))
    await store.dispatch(fetchMovements({ variantId: 'b', page: 1 }))
    finishFirst()
    await first

    expect(selectMovements(store.getState()).items).toEqual(['new'])
  })

  it('forgets everything on logout', () => {
    store.dispatch(sessionEnded())
    expect(list().items).toBeNull()
    expect(current().item).toBeNull()
  })
})

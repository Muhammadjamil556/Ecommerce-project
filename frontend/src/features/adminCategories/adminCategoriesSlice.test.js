import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionEnded } from '@/features/auth/authSlice'
import adminCategoriesReducer, {
  createCategory,
  deleteCategory,
  fetchCategories,
  selectAdminCategories,
  updateCategory,
} from './adminCategoriesSlice'
import * as api from './api/adminCategoriesApi'

// The real clients need a browser.
vi.mock('@/lib/apiClient', () => ({ apiClient: {} }))
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }))
vi.mock('./api/adminCategoriesApi')

const category = (id, sortOrder) => ({ id, name: id, sortOrder })

describe('adminCategoriesSlice', () => {
  let store
  const state = () => selectAdminCategories(store.getState())
  const ids = () => state().items.map(({ id }) => id)

  beforeEach(async () => {
    vi.resetAllMocks()
    store = configureStore({
      reducer: { adminCategories: adminCategoriesReducer },
    })
    api.getCategories.mockResolvedValue([category('a', 1), category('b', 2)])
    await store.dispatch(fetchCategories())
  })

  it('keeps the order of the API after changes', async () => {
    api.createCategory.mockResolvedValue(category('c', 1))
    await store.dispatch(createCategory({}))
    expect(ids()).toEqual(['a', 'c', 'b'])

    api.updateCategory.mockResolvedValue(category('b', 0))
    await store.dispatch(updateCategory({ id: 'b', changes: {} }))
    expect(ids()).toEqual(['b', 'a', 'c'])
  })

  it('removes a category only when deleting worked', async () => {
    api.deleteCategory.mockRejectedValueOnce(new Error('offline'))
    await store.dispatch(deleteCategory('a'))
    expect(ids()).toEqual(['a', 'b'])

    api.deleteCategory.mockResolvedValueOnce()
    await store.dispatch(deleteCategory('a'))
    expect(ids()).toEqual(['b'])
  })

  it('forgets everything on logout, even when an answer arrives later', async () => {
    const request = store.dispatch(fetchCategories())
    store.dispatch(sessionEnded())
    await request
    expect(state()).toMatchObject({ status: 'idle', items: null })
  })
})

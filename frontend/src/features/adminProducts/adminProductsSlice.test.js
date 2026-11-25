import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionEnded } from '@/features/auth/authSlice'
import adminProductsReducer, {
  createVariant,
  deleteImage,
  deleteProduct,
  deleteVariant,
  fetchProduct,
  fetchProducts,
  reorderImages,
  selectAdminProduct,
  selectAdminProductList,
  updateImage,
  updateProduct,
  updateVariant,
  uploadImage,
} from './adminProductsSlice'
import * as api from './api/adminProductsApi'

// The real clients need a browser.
vi.mock('@/lib/apiClient', () => ({ apiClient: {} }))
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }))
vi.mock('./api/adminProductsApi')

const variant = (id, sortOrder) => ({ id, sortOrder })
const product = {
  id: 'p1',
  name: 'Z8',
  variants: [variant('b', 1)],
  images: [],
}

describe('adminProductsSlice', () => {
  let store
  const list = () => selectAdminProductList(store.getState())
  const current = () => selectAdminProduct(store.getState())
  const variantIds = () => current().product.variants.map(({ id }) => id)

  beforeEach(() => {
    vi.resetAllMocks()
    store = configureStore({ reducer: { adminProducts: adminProductsReducer } })
  })

  async function open() {
    api.getProduct.mockResolvedValue(product)
    await store.dispatch(fetchProduct('p1'))
  }

  it('keeps the newest list when answers arrive out of order', async () => {
    let finishFirst
    api.getProducts
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishFirst = () => resolve({ items: ['old'], meta: {} })
        }),
      )
      .mockResolvedValueOnce({ items: ['new'], meta: {} })

    const first = store.dispatch(fetchProducts({}))
    await store.dispatch(fetchProducts({ search: 'x' }))
    finishFirst()
    await first

    expect(list()).toMatchObject({ status: 'succeeded', items: ['new'] })
  })

  it('stores the error in the plain shape', async () => {
    api.getProducts.mockRejectedValue(new Error('offline'))
    await store.dispatch(fetchProducts({}))
    expect(list()).toMatchObject({
      status: 'failed',
      error: { code: 'NETWORK_ERROR' },
    })
  })

  it('forgets everything on logout, even when an answer arrives later', async () => {
    api.getProduct.mockResolvedValue(product)
    const request = store.dispatch(fetchProduct('p1'))
    store.dispatch(sessionEnded())
    await request
    expect(current()).toMatchObject({ status: 'idle', product: null })
  })

  it('adds, reorders and removes variants of the open product', async () => {
    await open()

    api.createVariant.mockResolvedValue(variant('a', 2))
    await store.dispatch(createVariant({ productId: 'p1', values: {} }))
    expect(variantIds()).toEqual(['b', 'a'])

    api.updateVariant.mockResolvedValue(variant('a', 0))
    await store.dispatch(updateVariant({ productId: 'p1', id: 'a' }))
    expect(variantIds()).toEqual(['a', 'b'])

    api.deleteVariant.mockResolvedValue()
    await store.dispatch(deleteVariant({ productId: 'p1', id: 'b' }))
    expect(variantIds()).toEqual(['a'])
  })

  it('keeps a variant when deleting it fails', async () => {
    await open()
    api.deleteVariant.mockRejectedValue(new Error('offline'))
    await store.dispatch(deleteVariant({ productId: 'p1', id: 'b' }))
    expect(variantIds()).toEqual(['b'])
  })

  it('adds, edits, reorders and removes photos of the open product', async () => {
    await open()
    const images = () => current().product.images
    const target = { productId: 'p1', id: 'x' }

    api.uploadImage.mockResolvedValueOnce({ id: 'x', alt: 'X' })
    await store.dispatch(uploadImage({ productId: 'p1' }))
    api.uploadImage.mockResolvedValueOnce({ id: 'y', alt: 'Y' })
    await store.dispatch(uploadImage({ productId: 'p1' }))
    expect(images().map(({ id }) => id)).toEqual(['x', 'y'])

    api.updateImage.mockResolvedValue({ id: 'x', alt: 'New' })
    await store.dispatch(updateImage(target))
    expect(images()[0].alt).toBe('New')

    api.reorderImages.mockResolvedValue([{ id: 'y' }, { id: 'x' }])
    await store.dispatch(reorderImages({ productId: 'p1' }))
    expect(images().map(({ id }) => id)).toEqual(['y', 'x'])

    api.deleteImage.mockResolvedValue()
    await store.dispatch(deleteImage(target))
    expect(images().map(({ id }) => id)).toEqual(['y'])

    api.uploadImage.mockResolvedValueOnce({ id: 'z' })
    await store.dispatch(uploadImage({ productId: 'other' }))
    expect(images()).toHaveLength(1)
  })

  it('ignores changes to a product that is not open', async () => {
    await open()
    api.updateProduct.mockResolvedValue({ id: 'p2', name: 'Other' })
    await store.dispatch(updateProduct({ id: 'p2', changes: {} }))
    api.createVariant.mockResolvedValue(variant('x', 0))
    await store.dispatch(createVariant({ productId: 'p2', values: {} }))
    expect(current().product).toEqual(product)
  })

  it('closes a deleted product', async () => {
    await open()
    api.deleteProduct.mockResolvedValue()
    await store.dispatch(deleteProduct('p1'))
    expect(current().product).toBeNull()
  })
})

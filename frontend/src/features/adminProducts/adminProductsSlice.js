import { createSlice } from '@reduxjs/toolkit'
import { sessionEnded } from '@/features/auth/authSlice'
import { createApiThunk } from '@/lib/createApiThunk'
import { addRequestCases, initialRequest } from '@/lib/requestState'
import * as api from './api/adminProductsApi'

export const fetchProducts = createApiThunk(
  'adminProducts/fetchList',
  api.getProducts,
)
export const fetchProduct = createApiThunk(
  'adminProducts/fetchOne',
  api.getProduct,
)
export const createProduct = createApiThunk(
  'adminProducts/create',
  api.createProduct,
)
export const updateProduct = createApiThunk(
  'adminProducts/update',
  api.updateProduct,
)
export const deleteProduct = createApiThunk(
  'adminProducts/delete',
  api.deleteProduct,
)
export const createVariant = createApiThunk(
  'adminProducts/createVariant',
  api.createVariant,
)
export const updateVariant = createApiThunk(
  'adminProducts/updateVariant',
  api.updateVariant,
)
export const deleteVariant = createApiThunk(
  'adminProducts/deleteVariant',
  api.deleteVariant,
)

export const uploadImage = createApiThunk(
  'adminProducts/uploadImage',
  api.uploadImage,
)
export const updateImage = createApiThunk(
  'adminProducts/updateImage',
  api.updateImage,
)
export const reorderImages = createApiThunk(
  'adminProducts/reorderImages',
  api.reorderImages,
)
export const deleteImage = createApiThunk(
  'adminProducts/deleteImage',
  api.deleteImage,
)

const initialState = {
  list: { items: null, meta: null, ...initialRequest },
  current: { product: null, ...initialRequest },
}

/** The open product, if this change belongs to it. */
function openProduct(state, id) {
  return state.current.product?.id === id ? state.current.product : null
}

function inOrder(variants) {
  return variants.toSorted(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  )
}

const adminProductsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(sessionEnded, () => initialState)

    addRequestCases(builder, fetchProducts, 'list', (list, { items, meta }) => {
      list.items = items
      list.meta = meta
    })
    addRequestCases(builder, fetchProduct, 'current', (current, product) => {
      current.product = product
    })

    builder
      .addCase(updateProduct.fulfilled, (state, action) => {
        if (openProduct(state, action.payload.id)) {
          state.current.product = action.payload
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        if (openProduct(state, action.meta.arg)) {
          state.current = initialState.current
        }
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (!product) return
        product.variants = inOrder([...product.variants, action.payload])
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (!product) return
        product.variants = inOrder(
          product.variants.map((variant) =>
            variant.id === action.payload.id ? action.payload : variant,
          ),
        )
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        openProduct(state, action.meta.arg.productId)?.images.push(
          action.payload,
        )
      })
      .addCase(updateImage.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (!product) return
        product.images = product.images.map((image) =>
          image.id === action.payload.id ? action.payload : image,
        )
      })
      .addCase(reorderImages.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (product) product.images = action.payload
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (!product) return
        product.images = product.images.filter(
          (image) => image.id !== action.meta.arg.id,
        )
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        const product = openProduct(state, action.meta.arg.productId)
        if (!product) return
        product.variants = product.variants.filter(
          (variant) => variant.id !== action.meta.arg.id,
        )
      })
  },
})

export const selectAdminProductList = (state) => state.adminProducts.list
export const selectAdminProduct = (state) => state.adminProducts.current

export default adminProductsSlice.reducer

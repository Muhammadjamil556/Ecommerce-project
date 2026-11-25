import { createSlice } from '@reduxjs/toolkit'
import { sessionEnded } from '@/features/auth/authSlice'
import { createApiThunk } from '@/lib/createApiThunk'
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

// status: 'idle' | 'loading' | 'succeeded' | 'failed'
const request = { status: 'idle', error: null, requestId: null }
const initialState = {
  list: { items: null, meta: null, ...request },
  current: { product: null, ...request },
}

/** Handles loading, success and failure of one part of the state. */
function addRequestCases(builder, thunk, part, onSuccess) {
  // Only the newest request counts. After logout there is none.
  const isCurrent = (state, action) =>
    action.meta.requestId === state[part].requestId

  builder
    .addCase(thunk.pending, (state, action) => {
      state[part].status = 'loading'
      state[part].error = null
      state[part].requestId = action.meta.requestId
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (!isCurrent(state, action)) return
      state[part].status = 'succeeded'
      onSuccess(state[part], action.payload)
    })
    .addCase(thunk.rejected, (state, action) => {
      if (!isCurrent(state, action)) return
      state[part].status = 'failed'
      state[part].error = action.payload
    })
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

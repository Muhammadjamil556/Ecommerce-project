import { configureStore } from '@reduxjs/toolkit'
import adminReducer from '@/features/admin/adminSlice'
import adminCategoriesReducer from '@/features/adminCategories/adminCategoriesSlice'
import adminProductsReducer from '@/features/adminProducts/adminProductsSlice'
import authReducer from '@/features/auth/authSlice'
import healthReducer from '@/features/health/healthSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    adminCategories: adminCategoriesReducer,
    adminProducts: adminProductsReducer,
    health: healthReducer,
  },
})

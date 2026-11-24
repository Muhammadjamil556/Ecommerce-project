import { configureStore } from '@reduxjs/toolkit'
import adminReducer from '@/features/admin/adminSlice'
import authReducer from '@/features/auth/authSlice'
import healthReducer from '@/features/health/healthSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    health: healthReducer,
  },
})

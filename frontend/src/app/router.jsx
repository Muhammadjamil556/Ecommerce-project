import { createBrowserRouter } from 'react-router'
import { ErrorPage } from '@/components/common/ErrorPage'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { AccountPage } from '@/features/account/pages/AccountPage'
import { AdminHomePage } from '@/features/admin/pages/AdminHomePage'
import { GuestOnly } from '@/features/auth/components/GuestOnly'
import { RequireAdmin } from '@/features/auth/components/RequireAdmin'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { EmailConfirmedPage } from '@/features/auth/pages/EmailConfirmedPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { HomePage } from '@/features/home/pages/HomePage'

export const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },

      // Opened from emails
      { path: 'email-confirmed', element: <EmailConfirmedPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },

      // Only when logged out
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },

      // Only when logged in
      {
        element: <RequireAuth />,
        children: [
          { path: 'account', element: <AccountPage /> },
          {
            path: 'admin',
            element: <RequireAdmin />,
            children: [{ index: true, element: <AdminHomePage /> }],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

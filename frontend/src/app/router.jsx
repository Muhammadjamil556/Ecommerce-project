import { createBrowserRouter } from 'react-router'
import { ErrorPage } from '@/components/common/ErrorPage'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { HomePage } from '@/features/home/pages/HomePage'

export const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

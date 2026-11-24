import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/common/PageLoader'
import { selectAuth } from '../authSlice'
import { SessionError } from './SessionError'

/** Login and registration. After login, returns to the page the user wanted. */
export function GuestOnly() {
  const { status } = useSelector(selectAuth)
  const location = useLocation()

  if (status === 'loading') return <PageLoader />
  if (status === 'failed') return <SessionError />
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/'} replace />
  }
  return <Outlet />
}

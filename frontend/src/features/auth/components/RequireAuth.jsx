import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/common/PageLoader'
import { selectAuth } from '../authSlice'
import { SessionError } from './SessionError'

/** Pages inside need login. This is for convenience; NestJS enforces the real rules. */
export function RequireAuth() {
  const { status } = useSelector(selectAuth)
  const location = useLocation()

  if (status === 'loading') return <PageLoader />
  if (status === 'failed') return <SessionError />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

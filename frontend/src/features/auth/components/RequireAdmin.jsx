import { useSelector } from 'react-redux'
import { Link, Outlet } from 'react-router'
import { MessagePage } from '@/components/common/MessagePage'
import { Button } from '@/components/ui/button'
import { selectAuth } from '../authSlice'

/** Place inside RequireAuth. NestJS checks the role again on every request. */
export function RequireAdmin() {
  const { user } = useSelector(selectAuth)

  if (user?.role !== 'admin') {
    return (
      <MessagePage
        title="Access denied"
        message="This page is for administrators."
      >
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </MessagePage>
    )
  }
  return <Outlet />
}

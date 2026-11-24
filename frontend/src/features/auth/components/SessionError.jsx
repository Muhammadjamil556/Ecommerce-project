import { useDispatch, useSelector } from 'react-redux'
import { MessagePage } from '@/components/common/MessagePage'
import { Button } from '@/components/ui/button'
import { signOut } from '../api/authApi'
import { fetchCurrentUser, selectAuth } from '../authSlice'

/** Shown when the user is logged in but the API could not load their account. */
export function SessionError() {
  const dispatch = useDispatch()
  const { error, sessionUserId } = useSelector(selectAuth)

  return (
    <MessagePage
      title="Your account could not be loaded"
      message={error?.message}
    >
      <Button onClick={() => dispatch(fetchCurrentUser(sessionUserId))}>
        Try again
      </Button>
      <Button variant="outline" onClick={() => signOut()}>
        Log out
      </Button>
    </MessagePage>
  )
}

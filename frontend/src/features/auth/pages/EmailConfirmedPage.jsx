import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { MessagePage } from '@/components/common/MessagePage'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import { emailLinkError } from '@/lib/supabaseClient'
import { getAuthErrorMessage } from '../authErrors'
import { selectAuth } from '../authSlice'

/** Opened from the confirmation email. */
export function EmailConfirmedPage() {
  const { status } = useSelector(selectAuth)

  if (emailLinkError) {
    return (
      <MessagePage
        title="Email not confirmed"
        message={`${getAuthErrorMessage({ code: emailLinkError })} Log in to get a new one.`}
      >
        <Button asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </MessagePage>
    )
  }

  if (status === 'loading') return <PageLoader />

  // Without a session we cannot know whether a link was used, so make no claim.
  if (status === 'anonymous') {
    return (
      <MessagePage title="Welcome" message="Log in to continue.">
        <Button asChild>
          <Link to="/login">Log in</Link>
        </Button>
      </MessagePage>
    )
  }

  return (
    <MessagePage title="Email confirmed" message="Your account is ready.">
      <Button asChild>
        <Link to="/">Start shopping</Link>
      </Button>
    </MessagePage>
  )
}

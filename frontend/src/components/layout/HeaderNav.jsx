import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/api/authApi'
import { selectAuth } from '@/features/auth/authSlice'

export function HeaderNav() {
  const navigate = useNavigate()
  const { status, user } = useSelector(selectAuth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogOut() {
    setIsLoggingOut(true)
    // Leave first, so a protected page does not redirect to the login page.
    await navigate('/')
    try {
      await signOut()
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Show nothing while the session is being checked, so the menu does not flicker.
  if (status === 'loading') return null

  if (status === 'anonymous') {
    return (
      <nav aria-label="Account" className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Register</Link>
        </Button>
      </nav>
    )
  }

  return (
    <nav aria-label="Account" className="flex items-center gap-2">
      {user?.role === 'admin' && (
        <Button asChild variant="ghost">
          <Link to="/admin">Admin</Link>
        </Button>
      )}
      <Button asChild variant="ghost">
        <Link to="/account">Account</Link>
      </Button>
      <Button variant="outline" disabled={isLoggingOut} onClick={handleLogOut}>
        Log out
      </Button>
    </nav>
  )
}

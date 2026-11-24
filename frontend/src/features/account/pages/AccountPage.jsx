import { useSelector } from 'react-redux'
import { selectAuth } from '@/features/auth/authSlice'

export function AccountPage() {
  const { user } = useSelector(selectAuth)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd>{user.fullName ?? 'Not provided'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="break-words">{user.email}</dd>
        </div>
      </dl>
    </div>
  )
}

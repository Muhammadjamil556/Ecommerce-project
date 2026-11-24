import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { FormAlert } from '@/components/common/FormAlert'
import { FormField } from '@/components/common/FormField'
import { MessagePage } from '@/components/common/MessagePage'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import { updatePassword } from '../api/authApi'
import { getAuthErrorMessage } from '../authErrors'
import { passwordRecoveryFinished, selectAuth } from '../authSlice'
import { AuthCard } from '../components/AuthCard'
import { PASSWORD_HINT, resetPasswordSchema } from '../schemas/authSchemas'

/** Opened from the password reset email. */
export function ResetPasswordPage() {
  const dispatch = useDispatch()
  const { status, isPasswordRecovery } = useSelector(selectAuth)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit({ password }) {
    setErrorMessage(null)
    try {
      setResult(await updatePassword(password))
      dispatch(passwordRecoveryFinished())
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    }
  }

  if (result) {
    return (
      <MessagePage
        title="Password changed"
        message={
          result.otherDevicesLoggedOut
            ? 'You are logged in. Other devices have been logged out.'
            : 'You are logged in. Other devices may still be logged in.'
        }
      >
        <Button asChild>
          <Link to="/">Continue</Link>
        </Button>
      </MessagePage>
    )
  }

  if (!isPasswordRecovery) {
    if (status === 'loading') return <PageLoader />

    return (
      <MessagePage
        title="This link cannot be used"
        message="It may have expired or already been used. Please request a new one."
      >
        <Button asChild>
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </MessagePage>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      <FormAlert>{errorMessage}</FormAlert>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password}
          {...register('password')}
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </AuthCard>
  )
}

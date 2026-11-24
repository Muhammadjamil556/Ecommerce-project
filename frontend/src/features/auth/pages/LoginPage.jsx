import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { FormAlert } from '@/components/common/FormAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { signIn } from '../api/authApi'
import { getAuthErrorMessage } from '../authErrors'
import { AuthCard } from '../components/AuthCard'
import { ResendConfirmation } from '../components/ResendConfirmation'
import { loginSchema } from '../schemas/authSchemas'

export function LoginPage() {
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // On success authListener updates Redux, and GuestOnly leaves this page.
  async function onSubmit(values) {
    setErrorMessage(null)
    setUnconfirmedEmail(null)
    try {
      await signIn(values)
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
      if (error.code === 'email_not_confirmed') {
        setUnconfirmedEmail(values.email)
      }
    }
  }

  return (
    <AuthCard title="Log in">
      <FormAlert>{errorMessage}</FormAlert>
      {unconfirmedEmail && (
        <ResendConfirmation key={unconfirmedEmail} email={unconfirmedEmail} />
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link to="/forgot-password" className="underline">
          Forgot your password?
        </Link>
        <Link to="/register" state={location.state} className="underline">
          Create an account
        </Link>
      </div>
    </AuthCard>
  )
}

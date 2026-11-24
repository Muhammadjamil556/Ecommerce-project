import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { FormAlert } from '@/components/common/FormAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { signUp } from '../api/authApi'
import { getAuthErrorMessage } from '../authErrors'
import { AuthCard } from '../components/AuthCard'
import { ResendConfirmation } from '../components/ResendConfirmation'
import { PASSWORD_HINT, registerSchema } from '../schemas/authSchemas'

export function RegisterPage() {
  const location = useLocation()
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values) {
    setErrorMessage(null)
    try {
      await signUp(values)
      setRegisteredEmail(values.email)
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    }
  }

  // Same message whether or not the address already has an account, so nobody can
  // use this form to find out who is registered.
  if (registeredEmail) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a confirmation link to ${registeredEmail}. Open it to finish creating your account.`}
      >
        <ResendConfirmation email={registeredEmail} />
        <p className="text-sm">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create an account">
      <FormAlert>{errorMessage}</FormAlert>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Full name"
          autoComplete="name"
          error={errors.fullName}
          {...register('fullName')}
        />
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
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password}
          {...register('password')}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}

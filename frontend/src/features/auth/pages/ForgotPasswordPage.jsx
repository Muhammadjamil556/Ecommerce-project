import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { FormAlert } from '@/components/common/FormAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { requestPasswordReset } from '../api/authApi'
import { getAuthErrorMessage } from '../authErrors'
import { AuthCard } from '../components/AuthCard'
import { forgotPasswordSchema } from '../schemas/authSchemas'

export function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }) {
    setErrorMessage(null)
    try {
      await requestPasswordReset(email)
      setIsSent(true)
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    }
  }

  if (isSent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, we sent a link to reset the password."
      >
        <Link to="/login" className="text-sm underline">
          Back to login
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send you a reset link."
    >
      <FormAlert>{errorMessage}</FormAlert>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <Link to="/login" className="text-sm underline">
        Back to login
      </Link>
    </AuthCard>
  )
}

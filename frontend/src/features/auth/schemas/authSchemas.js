import { z } from 'zod'

const email = z.email('Enter a valid email address')

export const PASSWORD_HINT =
  'At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol'

// Keep in step with the password settings in Supabase, which enforces them.
// 72 is the longest password Supabase can store safely.
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/,
    'Add a symbol, such as ! or #',
  )

const passwordsMatch = {
  check: (values) => values.password === values.confirmPassword,
  error: { path: ['confirmPassword'], error: 'Passwords do not match' },
}

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Enter your name')
      .max(100, 'Use at most 100 characters'),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.error)

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.error)

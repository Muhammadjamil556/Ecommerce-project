import { apiClient } from '@/lib/apiClient'
import { supabase } from '@/lib/supabaseClient'

export const EMAIL_CONFIRMED_PATH = '/email-confirmed'
export const RESET_PASSWORD_PATH = '/reset-password'

function pageUrl(path) {
  return `${window.location.origin}${path}`
}

/** supabase-js returns errors instead of throwing them. Throwing suits forms better. */
async function unwrap(request) {
  const { data, error } = await request
  if (error) throw error
  return data
}

export function signUp({ fullName, email, password }) {
  return unwrap(
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: pageUrl(EMAIL_CONFIRMED_PATH),
      },
    }),
  )
}

export function resendConfirmation(email) {
  return unwrap(
    supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: pageUrl(EMAIL_CONFIRMED_PATH) },
    }),
  )
}

export function signIn({ email, password }) {
  return unwrap(supabase.auth.signInWithPassword({ email, password }))
}

/**
 * Logs out this browser only. supabase-js clears the local session before contacting
 * the server, so a network error here can be ignored: the user is logged out.
 */
export async function signOut() {
  await supabase.auth.signOut({ scope: 'local' })
}

export function requestPasswordReset(email) {
  return unwrap(
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: pageUrl(RESET_PASSWORD_PATH),
    }),
  )
}

/** Also logs out every other device, in case someone else knew the old password. */
export async function updatePassword(password) {
  await unwrap(supabase.auth.updateUser({ password }))
  // The password has changed by now, so a failure here must not look like one above.
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  return { otherDevicesLoggedOut: !error }
}

export async function getCurrentUser() {
  const response = await apiClient.get('/users/me')
  return response.data.data
}

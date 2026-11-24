import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Email links that fail (expired or already used) come back with an error in the
// address. Read it before the Supabase client changes the address.
export const emailLinkError = new URLSearchParams(
  window.location.hash.slice(1),
).get('error_code')

/**
 * Used for login only. Store data goes through apiClient and NestJS.
 * Keeps the session in localStorage and refreshes the token automatically.
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
)

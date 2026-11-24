import axios from 'axios'
import { env } from '@/lib/env'
import { supabase } from '@/lib/supabaseClient'

/** The only Axios instance in the app. Feature API files import this one. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
})

// Attaches the login token. getSession() refreshes it first if it has expired.
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

// The API rejected the token, so this browser's session is no longer usable.
apiClient.interceptors.response.use(undefined, async (error) => {
  const hadToken = Boolean(error.config?.headers?.Authorization)
  if (error.response?.status === 401 && hadToken) {
    await supabase.auth.signOut({ scope: 'local' })
  }
  throw error
})

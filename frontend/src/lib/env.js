import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_SUPABASE_URL: z.url(),
  // Accepting only this prefix keeps a secret key out of the website.
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^sb_publishable_(?!replace_me)\S+$/, {
      error: 'Must be your sb_publishable_... key',
    }),
})

const result = envSchema.safeParse(import.meta.env)

if (!result.success) {
  throw new Error(
    `Invalid environment variables. Check frontend/.env against frontend/.env.example.\n${z.prettifyError(result.error)}`,
  )
}

export const env = {
  apiUrl: result.data.VITE_API_URL,
  supabaseUrl: new URL(result.data.VITE_SUPABASE_URL).origin,
  supabasePublishableKey: result.data.VITE_SUPABASE_PUBLISHABLE_KEY,
}

import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url(),
})

const result = envSchema.safeParse(import.meta.env)

if (!result.success) {
  throw new Error(
    `Invalid environment variables. Check frontend/.env against frontend/.env.example.\n${z.prettifyError(result.error)}`,
  )
}

export const env = { apiUrl: result.data.VITE_API_URL }

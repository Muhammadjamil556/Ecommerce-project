import axios from 'axios'
import { env } from '@/lib/env'

/** The only Axios instance in the app. Feature API files import this one. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
})

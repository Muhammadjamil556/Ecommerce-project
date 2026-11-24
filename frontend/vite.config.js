import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets us write "@/components/..." instead of "../../../components/..."
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Must match FRONTEND_URL in backend/.env, so fail rather than use another port.
  server: { port: 5173, strictPort: true },
})

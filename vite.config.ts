import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    // PORT lets a second dev client run next to the default one (e.g. an IDE preview); Vite ignores it otherwise.
    port: Number(process.env.PORT) || 5173,
    // The React dev server forwards /api to the Express backend (npm run dev:server).
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
})

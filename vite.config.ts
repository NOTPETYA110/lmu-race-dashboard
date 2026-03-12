import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/races': {
        target: 'https://lmu-proxy.rnlnortherns.workers.dev',
        changeOrigin: true,
        rewrite: () => '/',
      },
    },
  },
})

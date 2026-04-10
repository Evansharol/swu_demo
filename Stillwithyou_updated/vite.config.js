import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  build: {
    commonjsOptions: {
      include: [/face-api/, /node_modules/]
    }
  }
})

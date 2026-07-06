import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/taf': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        headers: {
          'User-Agent': 'flightplan-dev/0.1',
        },
        rewrite: (path) => path.replace(/^\/api\/taf/, '/api/data/taf'),
      },
    },
  },
})

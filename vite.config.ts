import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/data/taf': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        headers: {
          'User-Agent': 'flightplan-dev/0.1',
        },
      },
      '/api/data/metar': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        headers: {
          'User-Agent': 'flightplan-dev/0.1',
        }
      }
    },
  },
})

import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import taf0000 from './src/test/taf-0000.json'
import metar0000 from './src/test/metar-0000.json'
import taf1111 from './src/test/taf-1111.json'
import metar1111 from './src/test/metar-1111.json'
import taf2222 from './src/test/taf-2222.json'
import metar2222 from './src/test/metar-2222.json'

const mockJsonResponse = (data: unknown): ProxyOptions => ({
  target: 'http://localhost',
  bypass: (request, response) => {
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(data))
    return request.url ?? '/'
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/aviationweather/taf\\?ids=0000(?:&|$)': mockJsonResponse(taf0000),
      '^/aviationweather/metar\\?ids=0000(?:&|$)': mockJsonResponse(metar0000),
      '^/aviationweather/taf\\?ids=1111(?:&|$)': mockJsonResponse(taf1111),
      '^/aviationweather/metar\\?ids=1111(?:&|$)': mockJsonResponse(metar1111),
      '^/aviationweather/taf\\?ids=2222(?:&|$)': mockJsonResponse(taf2222),
      '^/aviationweather/metar\\?ids=2222(?:&|$)': mockJsonResponse(metar2222),
      '/aviationweather/taf': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        headers: {
          'User-Agent': 'flightplan-dev/0.1',
        },
      },
      '/aviationweather/metar': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        headers: {
          'User-Agent': 'flightplan-dev/0.1',
        }
      },
      '/api/notam': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, "")
      }
    },
  },
})

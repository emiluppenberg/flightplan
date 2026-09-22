import { defineConfig, type ProxyOptions } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
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
    if (!response) return request.url ?? ""
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(data))
    return request.url ?? '/'
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "maskable-icon.png", "pwa-64.png", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "FlyRep",
        short_name: "FlyRep",
        description: "For efficient reading of flight reports",
        background_color: "#090913",
        theme_color: "#090913",
        icons: [
          {
            "src": "pwa-64.png",
            "sizes": "64x64",
            "type": "image/png"
          },
          {
            "src": "pwa-192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "pwa-512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            "src": "maskable-icon.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '^/api/reports/taf\\?ids=0000(?:&|$)': mockJsonResponse(taf0000),
      '^/api/reports/metar\\?ids=0000(?:&|$)': mockJsonResponse(metar0000),
      '^/api/reports/taf\\?ids=1111(?:&|$)': mockJsonResponse(taf1111),
      '^/api/reports/metar\\?ids=1111(?:&|$)': mockJsonResponse(metar1111),
      '^/api/reports/taf\\?ids=2222(?:&|$)': mockJsonResponse(taf2222),
      '^/api/reports/metar\\?ids=2222(?:&|$)': mockJsonResponse(metar2222),
    },
  },
})

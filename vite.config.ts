import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readRatingStar } from './build/ratingStar'

const devPort = Number(process.env.PORT ?? 5174)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __RATING_STAR_PATH__: JSON.stringify(readRatingStar(new URL('./src/assets/icons/star.svg', import.meta.url))),
  },
  server: {
    host: true,
    allowedHosts: true,
    port: devPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        xfwd: true,
      },
    },
  },
})

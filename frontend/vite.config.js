import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    // port: 8080, // !!!!!!!!!!!!!!!!!!!!!
    proxy: {
      '/api': { //  Proxy requests starting with /api
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
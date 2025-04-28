import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // fallback to same-origin if you didn’t set VITE_BACKEND_URL
  const backend = env.VITE_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: backend.replace(/^http/, 'ws'),
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vite.dev/config/
// export default defineConfig({
//
//   base: '/',
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': { //  Proxy requests starting with /api
//         target: 'http://localhost:5000',
//         changeOrigin: true,
//         secure: false,
//       },
//       '/socket.io': {
//         target: 'ws://localhost:5000',
//         ws: true,
//         changeOrigin: true,
//         secure: false
//       }
//     }
//   }
// })
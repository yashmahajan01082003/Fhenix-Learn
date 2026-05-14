import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

const progressApiOrigin = process.env.PROGRESS_API_ORIGIN || 'http://localhost:3101'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@cofhe/sdk'],
    exclude: ['tfhe'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
  },
  server: {
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm')
        }
        next()
      })
    },
    proxy: {
      '/api': {
        target: progressApiOrigin,
        changeOrigin: true
      }
    }
  }
});
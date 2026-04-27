import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 5174 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
})

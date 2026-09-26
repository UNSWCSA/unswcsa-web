import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('./cloud', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  define: { __ADMIN_BUILD__: JSON.stringify(mode === 'admin') },
  build: { outDir: mode === 'admin' ? '../dist-admin' : '../dist-site', emptyOutDir: true },
}))

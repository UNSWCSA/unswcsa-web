import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: fileURLToPath(new URL('./site', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react(), {
    name: 'site-events-proxy',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_worker.js', source: readFileSync(new URL('./site-worker.js', import.meta.url), 'utf8') })
      this.emitFile({ type: 'asset', fileName: '_routes.json', source: JSON.stringify({ version: 1, include: ['/api/events'], exclude: [] }) })
    },
  }],
  server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy: { '/api/events': { target: 'https://csa-events.unswcsa-exec.workers.dev', changeOrigin: true } } },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true, proxy: { '/api/events': { target: 'https://csa-events.unswcsa-exec.workers.dev', changeOrigin: true } } },
  build: { outDir: '../dist-site-preview', emptyOutDir: true },
})

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createLocalApi, createStore } from './poc/server.mjs'

export default defineConfig({
  root: fileURLToPath(new URL('./poc', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react(), {
    name: 'local-poc-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(createLocalApi(createStore(fileURLToPath(new URL('../local-data/poc/content.json', import.meta.url)))))
    },
  }],
  server: { host: '127.0.0.1', port: 5174, strictPort: true, fs: { strict: true } },
  build: { outDir: '../dist-poc', emptyOutDir: true },
})

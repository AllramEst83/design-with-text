import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

import type { IncomingMessage, ServerResponse } from 'node:http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
    {
      name: 'rss-proxy',
      configureServer(server) {
        server.middlewares.use(
          async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
            const url = req.url ?? ''
            if (!url.startsWith('/api/rss')) {
              next()
              return
            }
            if (req.method !== 'GET') {
              next()
              return
            }
            let feedUrl: string
            try {
              feedUrl = new URL(url, 'http://localhost').searchParams.get('url') ?? ''
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid URL' }))
              return
            }
            if (!feedUrl) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing url query parameter' }))
              return
            }
            try {
              const { default: Parser } = await import('rss-parser')
              const parser = new Parser({
                timeout: 20000,
                headers: {
                  'User-Agent': 'EditorialReader/1.0',
                },
              })
              const feed = await parser.parseURL(feedUrl)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(feed))
            } catch (e) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: e instanceof Error ? e.message : 'Failed to fetch or parse feed',
                }),
              )
            }
          },
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

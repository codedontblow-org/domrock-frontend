import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // O navegador chama /backend/...; o Vite repassa ao Spring (A6-14).
      proxy: {
        '^/backend(?:/|$)': {
          target: env.API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend(?=\/|$)/, ''),
        },
      },
    },
  }
})

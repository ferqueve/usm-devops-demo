import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Hosts extra para el dev server (Tailscale, tuneles, LAN). Son propios de
  // cada maquina, asi que se definen en frontend/.env.local (gitignoreado):
  //   DEV_ALLOWED_HOSTS=desktop,.ts.net
  const env = loadEnv(mode, __dirname, '')
  const extraHosts = (env.DEV_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Sin esto, el code splitting deja un chunk por cada icono de lucide
          // y por cada primitiva de radix: una navegacion se llevaba 35
          // pedidos de unos pocos KB cada uno, todos con su ida y vuelta.
          // Agrupados por libreria, son cuatro pedidos que ademas quedan
          // cacheados entre pantallas.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            'vendor-iconos': ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: false,
      // Producción ya no usa este servidor: la sirve nginx desde el build
      // estático (ver frontend/Dockerfile), así que acá sólo van hosts de dev.
      allowedHosts: [
        'localhost',
        ...extraHosts,
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.{test,spec}.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/**/index.{ts,tsx}',
        ],
      },
    },
  }
})

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
          // Se agrupa por ruta y no por nombre de paquete: nombrarlos exige que
          // cada uno sea dependencia directa y resuelva desde la raiz, y
          // html2canvas -- que entra a traves de jspdf -- rompia el build en CI,
          // donde pnpm no lo aplana.
          // Solo se agrupa lo que usan todas las pantallas. Recharts y jsPDF
          // quedaron afuera a proposito: un chunk con nombre propio entra en
          // los modulepreload del index, asi que agruparlos hacia que las 26
          // pantallas se bajaran 275 KB de PDF y 136 KB de graficos aunque no
          // dibujaran nada. Sueltos, viajan dentro del chunk de la pantalla que
          // los importa.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]lucide-react[\\/]/.test(id)) return 'vendor-iconos';
            if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
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

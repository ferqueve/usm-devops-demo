import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas extremo a extremo.
 *
 * El backend, el frontend y la base de datos los levanta el orquestador
 * `scripts/e2e.sh`; Playwright asume que ya están corriendo en los puertos
 * declarados aquí. Esto permite invocar `npx playwright test` directo cuando
 * se itera localmente con la pila ya levantada.
 */
export default defineConfig({
  testDir: './tests-e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

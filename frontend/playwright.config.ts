import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas extremo a extremo.
 *
 * El backend, el frontend y la base de datos los levanta el orquestador
 * `scripts/e2e.sh`; Playwright asume que ya están corriendo en los puertos
 * declarados aquí. Esto permite invocar `npx playwright test` directo cuando
 * se itera localmente con la pila ya levantada.
 */
// Con E2E_EVIDENCIA=1 la corrida guarda captura y trace de todos los tests,
// no solo de los que fallan, y deja los reportes html/junit/json en
// E2E_REPORTE_DIR. Es la corrida que se entrega como evidencia (TestLink/Mantis).
const evidencia = !!process.env.E2E_EVIDENCIA;
const reporteDir = process.env.E2E_REPORTE_DIR ?? 'e2e-reporte';

export default defineConfig({
  testDir: './tests-e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: evidencia
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: `${reporteDir}/html` }],
        ['junit', { outputFile: `${reporteDir}/junit.xml` }],
        ['json', { outputFile: `${reporteDir}/resultados.json` }],
      ]
    : process.env.CI
      ? [['github'], ['html', { open: 'never' }]]
      : 'list',
  outputDir: evidencia ? `${reporteDir}/artefactos` : undefined,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: evidencia ? 'on' : 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: evidencia ? 'on' : 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Alineamos la zona horaria del navegador con la que usa el seeder
    // (`America/Montevideo`) para que los tests que generan fechas en JS y
    // las comparan contra reservas seedeadas sean estables sin importar
    // la zona horaria del host.
    timezoneId: 'America/Montevideo',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

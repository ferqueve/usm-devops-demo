import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Crear reserva con un ítem solicitado: el docente agrega un Proyector E2E
 * desde la sección "Items Solicitados" y crea la solicitud. La validación
 * cubre que el ítem queda asociado al pedido visible en el form, y que
 * tras el envío la reserva aparece en el listado del docente.
 *
 * El flujo posterior (admin gestiona la solicitud generada en
 * /inventory/requests) ya está cubierto por
 * `inventory/request-flow.spec.ts`.
 */
test.describe('Reservas: creación con ítems solicitados', () => {
  test('docente agrega un Proyector E2E al pedido y la reserva se crea', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    const titulo = `Con items E2E ${Date.now()}`;
    await page.getByLabel(/Título \*/i).fill(titulo);

    await page.getByLabel(/^Carrera$/i).click();
    await page.getByRole('option', { name: /Ingeniería en Sistemas/i }).click();

    await page.getByLabel(/Analista \*/i).click();
    await page.getByRole('option', { name: /analista e2e/i }).click();

    // Agregar ítem solicitado: el botón "Agregar" suma un nuevo ítem con el
    // primer tipoElemento que devuelva la API (orden no determinista entre
    // los seedeados). El test asegura que se renderiza un card con alguno
    // de los tipos válidos para la pruebas.
    await page.getByRole('button', { name: /^Agregar$/i }).first().click();
    await expect(page.getByText(/Proyector E2E|Notebook E2E/i).first()).toBeVisible({ timeout: 5_000 });

    // Fecha: 5 días vista (libres respecto a las semanales del test recurring).
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 5);
    const dia = String(inicio.getDate());
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${dia}$`) })
      .first()
      .click();

    // Horas libres.
    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('07');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('08');
    await horas.nth(3).fill('00');

    await page.getByRole('button', { name: /Enviar Solicitud/i }).click();
    await page.waitForURL('**/reservations');

    // Vista de tabla para localizar la fila con el título único.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();
    await expect(page.locator('tr', { hasText: titulo }).first()).toBeVisible({ timeout: 10_000 });
  });
});

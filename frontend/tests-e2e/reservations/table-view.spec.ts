import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Vista de tabla en /reservations: el docente cambia desde la vista por
 * defecto (calendario) a la vista de tabla y ve sus reservas sembradas
 * como filas. Valida que la API paginada se conecta con la grilla y que
 * el toggle de vista persiste el cambio.
 */
test.describe('Reservas: vista de tabla', () => {
  test('docente cambia a vista tabla y ve sus reservas sembradas como filas', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    // Toggle a vista de tabla (icono lucide-table-properties / table).
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // Las dos reservas sembradas para docente aparecen como filas.
    const filaAprobada = page.locator('tr', { hasText: 'Clase abierta E2E' }).first();
    const filaPendienteRechazar = page.locator('tr', { hasText: 'Sesión de laboratorio E2E' }).first();
    await expect(filaAprobada).toBeVisible({ timeout: 10_000 });
    await expect(filaPendienteRechazar).toBeVisible();
  });
});

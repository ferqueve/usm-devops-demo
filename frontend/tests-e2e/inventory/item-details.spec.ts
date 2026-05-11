import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El botón "Ver Detalles" (ícono Eye) de cada fila abre
 * `InventoryDetailsDialog`, un modal de solo lectura que muestra los
 * campos del ítem (ID, tipo, cantidad, estado, espacio, observaciones,
 * fechas). Validamos que el modal renderiza datos consistentes con la
 * fila clickeada.
 */
test.describe('Inventario: diálogo de detalles', () => {
  test('admin abre el detalle del ítem en mantenimiento y ve los campos', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    const fila = page
      .locator('tbody tr', { hasText: 'Proyector E2E' })
      .filter({ hasText: 'Sala 202' })
      .filter({ hasText: /Mantenimiento/i })
      .first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-eye)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Detalles del Item de Inventario/i)).toBeVisible();
    await expect(dialog.getByText(/Tipo de Elemento/i)).toBeVisible();
    await expect(dialog.getByText('Proyector E2E', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Sala 202')).toBeVisible();
    // El campo Observaciones del seeder es "Proyector E2E en mantenimiento".
    await expect(dialog.getByText(/Proyector E2E en mantenimiento/i)).toBeVisible();

    await dialog.getByRole('button', { name: /^Cerrar$/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});

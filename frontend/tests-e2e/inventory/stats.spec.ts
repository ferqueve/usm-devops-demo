import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Las cards de estadísticas (`InventoryStatsCards`) muestran totales y
 * desglose por estado. Las renderiza la página `/inventory` antes de la
 * tabla. Verificamos que las etiquetas clave aparezcan para un rol con
 * `estadisticas:ver_inventario` (admin).
 */
test.describe('Inventario: tarjetas de estadísticas', () => {
  test('admin ve las stats de inventario en /inventory', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.getByText(/Total de Items/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Disponible/i).first()).toBeVisible();
    await expect(page.getByText(/Mantenimiento/i).first()).toBeVisible();
  });
});

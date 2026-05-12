import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `MantenimientoRecomendaciones` se renderiza dentro de
 * `InventoryManagement` para usuarios con permiso `inventario:editar`. El
 * componente carga `/recomendaciones/inventario/mantenimiento` y
 * `/recomendaciones/inventario/espacios-atencion`. Con el seeder hay un
 * Proyector E2E en MANTENIMIENTO (ítem urgente) y Lab 303 también en
 * MANTENIMIENTO (espacio que requiere atención); validamos que los dos
 * bloques aparezcan.
 */
test.describe('Recomendaciones: bloque de mantenimiento en /inventory', () => {
  test('mantenimiento ve los paneles de ítems urgentes y espacios que requieren atención', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.getByText(/Items que Requieren Mantenimiento Urgente/i).first())
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Espacios que Requieren Atención/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

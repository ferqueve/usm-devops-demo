import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol MANTENIMIENTO tiene `estadisticas:ver` + `inventario:editar`, por
 * lo que cae en la misma rama que ADMIN en `Statistics`: se muestran
 * ambas pestañas. Validamos que al cambiar a "Inventario" se renderiza
 * `InventoryStats`. Complementa `admin-tabs.spec.ts` confirmando que el
 * mismo flujo funciona con otro rol de gestión.
 */
test.describe('Estadísticas: mantenimiento también ve ambas pestañas', () => {
  test('mantenimiento alterna entre Reservas e Inventario en /statistics', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/statistics');
    await page.waitForURL('**/statistics');

    await expect(page.getByRole('tab', { name: /^Reservas$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('tab', { name: /^Inventario$/i })).toBeVisible();

    await page.getByRole('tab', { name: /^Inventario$/i }).click();
    await expect(page.getByRole('heading', { name: /Estadísticas de Inventario/i }))
      .toBeVisible({ timeout: 10_000 });
  });
});

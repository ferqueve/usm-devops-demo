import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol MANTENIMIENTO puede ver las estadísticas de inventario. Validamos
 * que `/statistics?tab=inventario` le muestra esa vista. Complementa
 * `admin-tabs.spec.ts` confirmando que el mismo flujo funciona con otro
 * rol de gestión.
 */
test.describe('Estadísticas: mantenimiento ve la vista de inventario', () => {
  test('mantenimiento abre /statistics?tab=inventario y ve Inventario', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/statistics?tab=inventario');
    await page.waitForURL('**/statistics**');

    await expect(page.getByText(/^Inventario: cómo está hoy/i)).toBeVisible({ timeout: 15_000 });
  });
});

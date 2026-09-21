import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El dashboard de un usuario con `canManageInventory` (rol MANTENIMIENTO)
 * muestra el estado del inventario ("El parque") y de los espacios ("Los
 * espacios"). Validamos que ambos bloques aparezcan.
 */
test.describe('Dashboard: bloques de inventario y espacios para mantenimiento', () => {
  test('mantenimiento ve el estado del inventario y de los espacios', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.waitForURL('**/dashboard');

    await expect(page.getByRole('heading', { name: /^El parque$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /^Los espacios$/i })).toBeVisible({ timeout: 10_000 });
  });
});

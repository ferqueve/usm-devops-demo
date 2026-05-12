import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El dashboard de un usuario con `canManageInventory` (rol MANTENIMIENTO)
 * agrega dos widgets exclusivos: `InventoryStatsWidget` y
 * `SpaceStatsWidget`. Validamos que ambos aparezcan con sus etiquetas
 * principales.
 */
test.describe('Dashboard: widgets de inventario y espacios para mantenimiento', () => {
  test('mantenimiento ve InventoryStatsWidget y SpaceStatsWidget', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.waitForURL('**/dashboard');

    await expect(page.getByText(/Total Items/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Total Espacios/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

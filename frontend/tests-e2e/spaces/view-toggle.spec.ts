import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Toggle de vista entre tarjetas (default) y tabla. Verificamos que la
 * tabla con `<tbody>` aparezca tras el click en el botón LayoutList y
 * desaparezca al volver a LayoutGrid.
 */
test.describe('Espacios: toggle de vista', () => {
  test('admin alterna entre tarjetas y tabla', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    // Estado inicial: tarjetas (no hay tbody).
    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    expect(await page.locator('tbody tr').count()).toBe(0);

    // Cambiar a tabla.
    await page.locator('button:has(svg.lucide-layout-list)').first().click();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Volver a tarjetas.
    await page.locator('button:has(svg.lucide-layout-grid)').first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('tbody tr').count()).toBe(0);
    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible();
  });
});

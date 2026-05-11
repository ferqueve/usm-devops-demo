import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Toggle entre vista de tabla (default) y vista de tarjetas. El botón de
 * cambio usa el ícono `LayoutGrid` cuando estás en tabla. Al activar las
 * tarjetas, los datos siguen mostrándose pero como `InventoryCardView`.
 */
test.describe('Inventario: vista de tarjetas', () => {
  test('admin alterna de tabla a tarjetas y ve los datos en cards', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('button:has(svg.lucide-layout-grid)').first().click();

    // Tras el toggle, la tabla ya no está presente, pero el texto del tipo
    // sembrado (Proyector E2E) sigue visible en alguna tarjeta.
    await expect(page.locator('tbody tr')).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByText(/Proyector E2E/i).first()).toBeVisible();
  });
});

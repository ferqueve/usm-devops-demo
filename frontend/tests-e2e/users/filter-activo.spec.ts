import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por estado activo/inactivo. Al momento de correrse este test
 * (`filter-activo` antes que `toggle-activo` alfabéticamente) todos los
 * usuarios siguen activos: filtrar por "Inactivos" debe dejar la tabla
 * vacía, y filtrar por "Activos" repuebla el listado.
 */
test.describe('Usuarios: filtro por estado activo', () => {
  test('admin filtra "Inactivos" y la tabla queda vacía', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    await page.getByRole('button', { name: /^Filtros$/i }).click();
    await page.locator('#active-filter').click();
    await page.getByRole('option', { name: /^Inactivos$/i }).click();
    await page.waitForTimeout(700);

    const main = page.locator('main');
    expect(await main.getByText(/@e2e\.test/i).count()).toBe(0);

    // "Activos" repuebla.
    await page.locator('#active-filter').click();
    await page.getByRole('option', { name: /^Activos$/i }).click();
    await page.waitForTimeout(700);
    expect(await main.getByText(/@e2e\.test/i).count()).toBeGreaterThan(0);
  });
});

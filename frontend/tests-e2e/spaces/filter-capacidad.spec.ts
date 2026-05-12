import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por capacidad mínima. El panel expone inputs numéricos
 * `#capacidad-min-filter` y `#capacidad-max-filter`. Las salas seedeadas
 * tienen capacidades 30 (Sala 101), 20 (Sala 202) y 15 (Lab 303). Con
 * mínimo 25 sólo Sala 101 califica.
 */
test.describe('Espacios: filtro por capacidad mínima', () => {
  test('admin filtra por capacidad >= 25 y solo ve Sala 101', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /^Filtros$/i }).click();
    await page.locator('#capacidad-min-filter').fill('25');
    await page.waitForTimeout(800);

    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Sala 202', { exact: true }).count()).toBe(0);
    expect(await page.getByText('Lab 303', { exact: true }).count()).toBe(0);
  });
});

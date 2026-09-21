import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin filtra el listado por estado MANTENIMIENTO usando el panel de
 * filtros (`#estado-filter`). El seeder pone una única sala en ese estado
 * ("Lab 303"), por lo que la tabla debe mostrarla y ocultar las demás.
 */
test.describe('Espacios: filtro por estado', () => {
  test('admin filtra por MANTENIMIENTO y solo ve Lab 303', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page
      .getByRole('group', { name: /^Estado$/i })
      .getByRole('button', { name: /^En mantenimiento$/i })
      .click();
    await page.waitForTimeout(700);

    await expect(page.getByText('Lab 303').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText(/^Sala 101$/).count()).toBe(0);
    expect(await page.getByText(/^Sala 202$/).count()).toBe(0);
  });
});

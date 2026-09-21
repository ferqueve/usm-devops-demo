import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por tipo de elemento (combobox "Elemento"). El admin elige
 * "Notebook E2E" y solo deben aparecer los ítems de ese tipo. El seeder
 * pone un único Notebook E2E (en Sala 101); los Proyector E2E quedan
 * fuera.
 */
test.describe('Inventario: filtro por tipo de elemento', () => {
  test('admin filtra por Notebook E2E y no ve los Proyector', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /^Filtrar: todos los tipos$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Notebook E2E$/i }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    await expect(page.locator('tbody tr').filter({ hasText: 'Notebook E2E' }).first())
      .toBeVisible({ timeout: 10_000 });
    expect(await page.locator('tbody tr').filter({ hasText: 'Proyector E2E' }).count()).toBe(0);
  });
});

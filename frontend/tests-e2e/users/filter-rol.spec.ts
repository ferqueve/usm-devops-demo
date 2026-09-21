import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por rol en `/users`. Al elegir DOCENTE solo debe quedar el
 * usuario seedeado con ese rol; los otros cinco roles desaparecen del
 * listado.
 */
test.describe('Usuarios: filtro por rol', () => {
  test('admin filtra por DOCENTE y solo aparece ese usuario', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    // Filtro compacto de rol: el ícono abre un popover con los roles.
    await page.getByRole('button', { name: /^Filtrar: todos los roles$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Docente$/i }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    const main = page.locator('main');
    await expect(main.getByText('docente@e2e.test').first()).toBeVisible({ timeout: 10_000 });
    expect(await main.getByText('admin@e2e.test').count()).toBe(0);
    expect(await main.getByText('estudiante@e2e.test').count()).toBe(0);
  });
});

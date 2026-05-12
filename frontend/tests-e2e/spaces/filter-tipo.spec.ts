import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por tipo de espacio. Al elegir "Laboratorio E2E" en el panel de
 * filtros, solo aparece la sala seedeada de ese tipo (Lab 303), excluyendo
 * las del tipo "Sala E2E".
 */
test.describe('Espacios: filtro por tipo', () => {
  test('admin filtra por Laboratorio E2E y oculta las salas comunes', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /^Filtros$/i }).click();
    await page.locator('#tipo-filter').click();
    await page.getByRole('option', { name: /^Laboratorio E2E$/i }).click();
    await page.waitForTimeout(700);

    await expect(page.getByText('Lab 303').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText(/^Sala 101$/).count()).toBe(0);
    expect(await page.getByText(/^Sala 202$/).count()).toBe(0);
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Búsqueda por nombre de espacio. El input "Buscar por nombre de
 * espacio..." filtra el listado server-side. Al tipear "Sala 101" solo esa
 * sala debe quedar visible.
 */
test.describe('Espacios: búsqueda por nombre', () => {
  test('admin busca "Sala 101" y solo aparece esa fila', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByPlaceholder(/Buscar por nombre de espacio/i).fill('Sala 101');
    await page.waitForTimeout(800);

    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Sala 202', { exact: true }).count()).toBe(0);
    expect(await page.getByText('Lab 303', { exact: true }).count()).toBe(0);
  });
});

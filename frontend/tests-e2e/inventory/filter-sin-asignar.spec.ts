import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro "Sin asignar" en /inventory: el combobox de espacio incluye la
 * opción especial "Sin asignar", que setea `sinAsignar=true` en el filtro y
 * trae solo los ítems sin espacio. El seeder pone un único ítem en ese
 * estado (Proyector E2E sin asignar, cantidad 1).
 */
test.describe('Inventario: filtro "sin asignar"', () => {
  test('admin filtra por sin asignar y solo ve los ítems sin espacio', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Abrir el filtro de espacios y elegir "Sin asignar".
    await page.getByRole('button', { name: /^Filtrar: todos los espacios$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Sin asignar$/i }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    // El ítem sin asignar aparece y los con espacio no.
    await expect(page.locator('tbody tr').filter({ hasText: 'Sin asignar' }).first())
      .toBeVisible({ timeout: 10_000 });
    expect(await page.locator('tbody tr').filter({ hasText: /^Sala 101$|^Sala 202$/ }).count()).toBe(0);
  });
});

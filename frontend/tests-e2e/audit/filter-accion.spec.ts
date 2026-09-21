import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por tipo de acción en `/audit`. Al elegir "Crear" en el popover
 * del filtro de acción, el listado debe traer solo registros con esa acción (el
 * seeder genera muchísimos CREATE para usuarios, espacios, reservas,
 * etc., así que al menos una fila siempre aparece).
 */
test.describe('Auditoría: filtro por acción', () => {
  test('admin filtra por CREATE y la tabla sigue mostrando registros', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/audit');
    await page.waitForURL('**/audit');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15_000 });

    // Filtro compacto: el botón del ícono abre un popover con las acciones
    // traducidas ("Crear" para CREATE).
    await page.getByRole('button', { name: /^Filtrar: todas las acciones$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByRole('button', { name: /^Filtrar: Crear$/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    // Tras filtrar, sigue habiendo filas (varios CREATE en el seed) y la
    // badge "Crear" aparece en alguna fila.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('tbody').getByText(/Crear/i).first()).toBeVisible();
  });
});

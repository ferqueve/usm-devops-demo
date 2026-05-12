import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por tipo de acción en `/audit`. Al elegir CREATE en el dropdown
 * `#accion`, el listado debe traer solo registros con esa acción (el
 * seeder genera muchísimos CREATE para usuarios, espacios, reservas,
 * etc., así que al menos una fila siempre aparece).
 */
test.describe('Auditoría: filtro por acción', () => {
  test('admin filtra por CREATE y la tabla sigue mostrando registros', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/audit');
    await page.waitForURL('**/audit');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15_000 });

    // El panel de filtros puede arrancar colapsado; lo abrimos si hace falta.
    const filtersToggle = page.getByRole('button', { name: /^Filtros$/i });
    if ((await filtersToggle.count()) > 0) {
      await filtersToggle.first().click();
    }

    await page.locator('#accion').click();
    // El dropdown muestra labels traducidos: "Crear" para CREATE.
    await page.getByRole('option', { name: /^Crear$/i }).click();
    await page.waitForTimeout(700);

    // Tras filtrar, sigue habiendo filas (varios CREATE en el seed) y la
    // badge "Crear" aparece en alguna fila.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('tbody').getByText(/Crear/i).first()).toBeVisible();
  });
});

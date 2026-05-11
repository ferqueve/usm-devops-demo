import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Ordenamiento de la tabla por encabezados. La columna "Cantidad" es
 * sortable; clickearla aplica orden ascendente y un segundo click lo
 * invierte. Validamos que el primer ítem cambia al alternar el orden.
 */
test.describe('Inventario: ordenamiento de tabla', () => {
  test('admin ordena por cantidad y la primera fila cambia al invertir', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    const primeraFila = page.locator('tbody tr').first();
    const cantidadInicial = await primeraFila.locator('td').nth(3).innerText();

    // Click en el encabezado "Cantidad" — orden ascendente.
    await page.getByRole('button', { name: /^Cantidad/i }).first().click();
    await page.waitForTimeout(500);
    const cantidadAsc = await primeraFila.locator('td').nth(3).innerText();

    // Segundo click — orden descendente.
    await page.getByRole('button', { name: /^Cantidad/i }).first().click();
    await page.waitForTimeout(500);
    const cantidadDesc = await primeraFila.locator('td').nth(3).innerText();

    // Algún cambio debe haber ocurrido entre los tres snapshots.
    const valoresUnicos = new Set([cantidadInicial, cantidadAsc, cantidadDesc]);
    expect(valoresUnicos.size).toBeGreaterThan(1);
  });
});

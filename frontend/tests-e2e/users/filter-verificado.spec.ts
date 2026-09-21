import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por estado de verificación. Todos los usuarios seedeados están
 * `verificado=true`, así que al elegir "Sin verificar" el listado queda
 * vacío y al elegir "Verificados" siguen apareciendo. Validamos ambas
 * direcciones.
 */
test.describe('Usuarios: filtro por verificación', () => {
  test('admin filtra "Sin verificar" y la tabla queda vacía, luego "Verificados" la repobla', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const verificacion = page.getByRole('group', { name: /Verificación/i });
    await verificacion.getByRole('button', { name: /^Sin verificar$/i }).click();
    await page.waitForTimeout(700);

    const main = page.locator('main');
    expect(await main.getByText(/@e2e\.test/i).count()).toBe(0);

    // Volvemos a filtrar por "Verificados" — vuelven a aparecer los seedeados.
    await verificacion.getByRole('button', { name: /^Verificados$/i }).click();
    await page.waitForTimeout(700);
    expect(await main.getByText(/@e2e\.test/i).count()).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El analista tiene `estadisticas:ver_reservas` pero NO
 * `estadisticas:ver_inventario`. Aunque pida `?tab=inventario`, la página
 * `/statistics` le muestra la vista de Reservas.
 */
test.describe('Estadísticas: analista solo ve estadísticas de reservas', () => {
  test('analista entra a /statistics y ve únicamente el bloque de Reservas', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/statistics?tab=inventario');
    await page.waitForURL('**/statistics**');

    await expect(page.getByText(/^Reservas del período/i)).toBeVisible({ timeout: 15_000 });
    // No debe aparecer la vista de inventario.
    expect(await page.getByText(/^Inventario: cómo está hoy/i).count()).toBe(0);
  });
});

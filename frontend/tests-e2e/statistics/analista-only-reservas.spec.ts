import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El analista tiene `estadisticas:ver` pero NO `inventario:editar`. La
 * página `/statistics` renderiza solo `ReservationStatsAnalista`, sin
 * tabs ni la sección de inventario.
 */
test.describe('Estadísticas: analista solo ve estadísticas de reservas', () => {
  test('analista entra a /statistics y ve únicamente el bloque de Reservas', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/statistics');
    await page.waitForURL('**/statistics');

    await expect(page.getByRole('heading', { name: /Estadísticas de Reservas/i }))
      .toBeVisible({ timeout: 15_000 });
    // No debe aparecer el encabezado del bloque de inventario.
    expect(await page.getByRole('heading', { name: /Estadísticas de Inventario/i }).count()).toBe(0);
    // Ni los tabs de Radix.
    expect(await page.getByRole('tab', { name: /^Inventario$/i }).count()).toBe(0);
  });
});

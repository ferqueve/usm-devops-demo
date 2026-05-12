import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin tiene `estadisticas:ver` + `inventario:editar`, lo que dispara
 * la rama de Tabs en `Statistics` con dos pestañas: "Reservas" e
 * "Inventario". Validamos que la pestaña inicial (Reservas) carga el
 * componente `ReservationStatsAnalista` y que al cambiar a "Inventario"
 * se muestra el componente `InventoryStats`.
 */
test.describe('Estadísticas: admin ve ambos tabs', () => {
  test('admin alterna entre Reservas e Inventario', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/statistics');
    await page.waitForURL('**/statistics');

    await expect(page.getByRole('heading', { name: /Estadísticas de Reservas/i }))
      .toBeVisible({ timeout: 15_000 });

    await page.getByRole('tab', { name: /^Inventario$/i }).click();
    await expect(page.getByRole('heading', { name: /Estadísticas de Inventario/i }))
      .toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin tiene `estadisticas:ver_reservas` y `estadisticas:ver_inventario`.
 * La vista se elige con `?tab=` (desde el submenú lateral): sin parámetro
 * abre Reservas y con `?tab=inventario` abre Inventario. El subtítulo del
 * encabezado cambia según la vista.
 */
test.describe('Estadísticas: admin ve ambas vistas', () => {
  test('admin alterna entre Reservas e Inventario', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/statistics');
    await page.waitForURL('**/statistics');

    await expect(page.getByText(/^Reservas del período/i)).toBeVisible({ timeout: 15_000 });

    await page.goto('/statistics?tab=inventario');
    await expect(page.getByText(/^Inventario: cómo está hoy/i)).toBeVisible({ timeout: 10_000 });
  });
});

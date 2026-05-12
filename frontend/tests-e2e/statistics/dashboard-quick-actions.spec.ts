import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `QuickActions` se monta en el dashboard para roles con
 * `canCreateReservations`. Para un docente debe mostrar al menos "Nueva
 * Reserva" y "Ver Calendario" (los otros dos botones se gatean por
 * permisos adicionales que el docente no tiene).
 */
test.describe('Dashboard: acciones rápidas por rol', () => {
  test('docente ve Quick Actions con "Nueva Reserva" y "Ver Calendario"', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.waitForURL('**/dashboard');

    // El accessible name de cada botón incluye su descripción al lado.
    await expect(page.getByRole('button', { name: /^Nueva Reserva/i }).first())
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^Ver Calendario/i }).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

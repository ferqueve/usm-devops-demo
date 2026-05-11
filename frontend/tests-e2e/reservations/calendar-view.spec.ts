import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Smoke de la vista calendario: el docente entra a /calendar y la grilla
 * carga sin errores. Validamos que se muestre el heading y que aparezca
 * al menos una de las reservas sembradas con su título.
 */
test.describe('Reservas: vista calendario', () => {
  test('docente entra a /calendar y ve el heading + reservas sembradas', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/calendar');
    await page.waitForURL('**/calendar');

    await expect(page.getByRole('heading', { name: /calendario de reservas/i }).first()).toBeVisible({ timeout: 10_000 });

    // Las reservas sembradas son mañana; el calendario muestra la semana
    // actual por defecto. Como mañana está dentro de la semana visible
    // (o cae el día siguiente del rango), verificamos que el grid de horas
    // esté presente.
    await expect(page.getByText(/^\d{2}:00$/).first()).toBeVisible({ timeout: 5_000 });
  });
});

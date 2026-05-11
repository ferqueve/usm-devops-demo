import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El diálogo de detalles (`ReservationDetailsDialog`) se abre al clickear
 * el ícono de ojo en una fila. Verifica que el modal renderiza el título,
 * el espacio y el badge de estado correspondientes a la reserva sembrada.
 */
test.describe('Reservas: diálogo de detalles', () => {
  test('docente abre detalle de su APROBADA y ve título, espacio y estado', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    const fila = page.locator('tr', { hasText: 'Clase abierta E2E' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-eye)').first().click();

    // El dialog usa role="dialog" y contiene el título, el espacio y un
    // badge "Aprobada".
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Clase abierta E2E').first()).toBeVisible();
    await expect(dialog.getByText('Sala 202').first()).toBeVisible();
    await expect(dialog.getByText(/Aprobada/i).first()).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin rechaza la reserva pendiente sembrada con un mensaje de motivo
 * en el AlertDialog. Análogo al spec de aprobación pero por la rama de
 * rechazo, que adicionalmente ejercita la persistencia del mensaje.
 */
test.describe('Reservas: admin rechaza pendiente', () => {
  test('admin rechaza la reserva pendiente con un motivo', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    const titulo = 'Sesión de laboratorio E2E';
    const tituloLocator = page.getByText(titulo).first();
    await expect(tituloLocator).toBeVisible({ timeout: 15_000 });
    await tituloLocator.click();

    const rechazar = page.getByRole('button', { name: /^Rechazar$/i }).first();
    await expect(rechazar).toBeVisible();
    await rechazar.click();

    // Diálogo de confirmación con un textarea opcional.
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/motivo del rechazo/i).fill('Conflicto con otra actividad ya programada');
    await dialog.getByRole('button', { name: /^Rechazar Reserva$/i }).click();

    // Toast de éxito.
    await expect(page.getByText(/reserva rechazada/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

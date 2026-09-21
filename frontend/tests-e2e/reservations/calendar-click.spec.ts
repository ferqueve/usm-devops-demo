import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Interacción primaria del calendario: el docente entra a /calendar y
 * clickea sobre el evento correspondiente a la reserva sembrada "Clase
 * abierta E2E". Esto debe abrir `ReservationDetailsDialog` con los datos
 * de la reserva. Cada barra del calendario es un `<button>` cuyo aria-label
 * es el título; lo usamos como locator estable.
 */
test.describe('Reservas: clic en evento del calendario abre detalle', () => {
  test('docente clickea evento y se abre el diálogo de detalles', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/calendar');
    await page.waitForURL('**/calendar');

    // El aria-label de cada barra es `${espacioNombre} — hh:mm a. m. a hh:mm p. m.`.
    // La APROBADA sembrada es Sala 202 mañana 18:00-20:00.
    const evento = page.getByRole('button', { name: /Sala 202 — 06:00 p\. m\. a 08:00 p\. m\./ }).first();
    await expect(evento).toBeVisible({ timeout: 10_000 });
    await evento.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Clase abierta E2E').first()).toBeVisible();
    await expect(dialog.getByText('Sala 202').first()).toBeVisible();
  });
});

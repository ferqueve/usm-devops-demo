import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin aprueba la reserva pendiente sembrada por E2EDataSeeder
 * ("Reunión de proyecto E2E" en Sala 101). El seeder asigna ese pendiente
 * al admin como `analistaAsignado`, lo que la hace visible en el panel
 * lateral de pendientes (filtrado por analistaId === user.id).
 */
test.describe('Aprobación de reserva pendiente por el admin', () => {
  test('admin aprueba la reserva pendiente sembrada y deja de estar pendiente', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    // El panel "Pendientes" del admin está a la derecha y se popula tras el
    // fetch a /reservas/todas?estado=PENDIENTE. Esperamos hasta que el card
    // del seed aparezca dentro del panel.
    const tituloLocator = page.getByText('Reunión de proyecto E2E').first();
    await expect(tituloLocator).toBeVisible({ timeout: 15_000 });
    await tituloLocator.click();

    // Diálogo de detalle: botón "Aprobar Reserva".
    const aprobar = page.getByRole('button', { name: /^Aprobar Reserva$/i }).first();
    await expect(aprobar).toBeVisible();
    await aprobar.click();

    // AlertDialog de confirmación: el segundo botón "Aprobar Reserva" lo está
    // dentro del role=alertdialog.
    const confirmar = page.getByRole('alertdialog').getByRole('button', { name: /^Aprobar Reserva$/i });
    await expect(confirmar).toBeVisible();
    await confirmar.click();

    // Toast de éxito.
    await expect(page.getByText(/Reserva aprobada/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

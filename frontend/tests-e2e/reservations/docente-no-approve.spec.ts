import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El docente abre el diálogo de detalles de su propia reserva pendiente
 * ("Charla docente E2E") y verifica que los botones "Aprobar Reserva" y
 * "Rechazar" no aparecen, porque carece de `reserva:aprobar`. El
 * `PermissionGuard` en `ReservationDetailsDialog` es quien los oculta.
 */
test.describe('Reservas: docente no ve botones de aprobación', () => {
  test('docente abre detalle de su pendiente y no aparece Aprobar Reserva', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    const fila = page.locator('tr', { hasText: 'Charla docente E2E' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });

    // Abrir detalles con el ícono ojo (lucide-eye).
    await fila.locator('button:has(svg.lucide-eye)').first().click();

    // Diálogo abierto: verificamos que no haya botón Aprobar Reserva.
    await expect(page.getByText('Charla docente E2E').first()).toBeVisible();
    expect(await page.getByRole('button', { name: /^Aprobar Reserva$/i }).count()).toBe(0);
    expect(await page.getByRole('button', { name: /^Rechazar$/i }).count()).toBe(0);
  });
});

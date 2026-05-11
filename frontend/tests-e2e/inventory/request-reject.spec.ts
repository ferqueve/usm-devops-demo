import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Flujo de rechazo de una solicitud de inventario. El seeder agrega una
 * segunda solicitud PENDIENTE específicamente para este test ("Solicitud
 * para rechazo E2E"). El admin abre el dialog "Gestionar", clickea
 * "Rechazar" y la solicitud queda en RECHAZADO sin asignar inventario.
 */
test.describe('Inventario: rechazo de solicitud', () => {
  test('admin rechaza la solicitud pendiente sin asignar inventario', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory/requests');
    await page.waitForURL('**/inventory/requests');

    // `request-flow.spec.ts` (corre antes alfabéticamente) consume la
    // primera de las dos pendientes seedeadas. La que queda en estado
    // Pendiente es la única candidata para este flujo.
    const fila = page
      .locator('tr', { hasText: 'Pendiente' })
      .filter({ hasText: 'Proyector E2E' })
      .first();
    await expect(fila).toBeVisible({ timeout: 15_000 });
    await fila.getByRole('button', { name: /Gestionar/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: /^Rechazar$/i }).click();
    await expect(page.getByText(/Solicitud rechazada/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

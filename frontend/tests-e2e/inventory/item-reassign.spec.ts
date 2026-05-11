import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cuando un ítem ya tiene un espacio asignado, el botón Package del
 * `AssignSpaceDialog` cambia su título a "Reasignar Espacio" y expone un
 * botón secundario "Desasignar". Apuntamos al Proyector E2E que sigue en
 * Sala 101 (cantidad 2, DISPONIBLE) por ser el único ítem que aún tiene
 * espacio asignado cuando llega este test alfabéticamente.
 */
test.describe('Inventario: reasignar ítem con desasignar', () => {
  test('admin desasigna el Proyector E2E sembrado en Sala 101', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    const fila = page
      .locator('tbody tr', { hasText: 'Proyector E2E' })
      .filter({ hasText: 'Sala 101' })
      .filter({ hasText: /Disponible/i })
      .first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-package)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Reasignar Espacio/i)).toBeVisible();
    await dialog.getByRole('button', { name: /^Desasignar/i }).click();

    await expect(page.getByText(/desasignado|sin asignar/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Bulk actions sobre la tabla de inventario. La barra `BulkActionsBar` se
 * activa al marcar al menos un checkbox en la primera columna. Permite
 * cambiar el estado en masa con confirmación en `AlertDialog`. Probamos
 * cambiando dos ítems a "Dañado" y validando el toast resultante.
 */
test.describe('Inventario: acciones masivas', () => {
  test('admin marca dos ítems y los cambia a DAÑADO desde el dropdown de estado', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Marcar los dos últimos ítems (Bulk target 1/2 E2E, seedeados al final
    // del listado por ID asc) para no interferir con el resto de los tests.
    const checkboxes = page.locator('tbody tr [role="checkbox"]');
    const total = await checkboxes.count();
    expect(total).toBeGreaterThanOrEqual(2);
    await checkboxes.nth(total - 2).click();
    await checkboxes.nth(total - 1).click();

    // La barra de acciones masivas debe aparecer con "2 items seleccionados".
    await expect(page.getByText(/2 items? seleccionados?/i)).toBeVisible({ timeout: 5_000 });

    // Abrir el menú "Estado" y elegir Dañado.
    await page.getByRole('button', { name: /^Estado$/i }).click();
    await page.getByRole('menuitem', { name: /Marcar como Dañado/i }).click();

    // AlertDialog de confirmación.
    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText(/cambio masivo de estado/i)).toBeVisible();
    await confirm.getByRole('button', { name: /^Confirmar$/i }).click();

    await expect(page.getByText(/Estado de 2 items actualizado/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

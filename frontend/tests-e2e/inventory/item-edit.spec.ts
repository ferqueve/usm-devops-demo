import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin edita el ítem sembrado en Sala 202 (Proyector E2E en
 * MANTENIMIENTO, cantidad 1) cambiando la cantidad a 5 y dejando una
 * observación nueva. El diálogo "Editar Item de Inventario" reutiliza el
 * mismo componente que el de creación.
 */
test.describe('Inventario: edición de ítem', () => {
  test('admin actualiza cantidad y observaciones del ítem en mantenimiento', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    // `item-assign-space.spec.ts` corre antes y deja un segundo Proyector
    // E2E en Sala 202; filtramos por el badge "Mantenimiento" para apuntar
    // al ítem original.
    const fila = page
      .locator('tr', { hasText: 'Proyector E2E' })
      .filter({ hasText: 'Sala 202' })
      .filter({ hasText: /Mantenimiento/i })
      .first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Editar Item de Inventario/i)).toBeVisible();

    const cantidad = dialog.getByLabel(/Cantidad \*/i);
    await cantidad.fill('5');

    const nuevaObservacion = `Edit E2E ${Date.now()}`;
    await dialog.getByLabel(/Observaciones/i).fill(nuevaObservacion);

    await dialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/actualizado.*éxito|actualizado.*exitosamente/i).first()).toBeVisible({ timeout: 10_000 });

    const filaActualizada = page
      .locator('tr', { hasText: 'Proyector E2E' })
      .filter({ hasText: 'Sala 202' })
      .filter({ hasText: /Mantenimiento/i })
      .first();
    await expect(filaActualizada).toContainText('5');
  });
});

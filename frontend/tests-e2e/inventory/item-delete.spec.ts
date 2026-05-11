import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin elimina el ítem seedeado Notebook E2E en Sala 101. Tras la
 * confirmación, la fila desaparece de la tabla.
 */
test.describe('Inventario: borrado de ítem', () => {
  test('admin elimina el Notebook E2E y deja de aparecer en la tabla', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    const fila = page
      .locator('tr', { hasText: 'Notebook E2E' })
      .filter({ hasText: 'Sala 101' })
      .first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-trash-2)').first().click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText(/¿Estás seguro/i)).toBeVisible();
    await confirm.getByRole('button', { name: /^Eliminar$/i }).click();

    await expect(page.getByText(/eliminado.*éxito|eliminado.*exitosamente/i).first())
      .toBeVisible({ timeout: 10_000 });
    // La fila Notebook E2E en Sala 101 ya no aparece.
    await expect(
      page.locator('tr', { hasText: 'Notebook E2E' }).filter({ hasText: 'Sala 101' })
    ).toHaveCount(0, { timeout: 5_000 });
  });
});

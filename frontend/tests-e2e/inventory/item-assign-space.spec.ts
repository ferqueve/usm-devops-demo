import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin asigna el ítem seedeado sin espacio (Proyector E2E, cantidad 1,
 * sin asignar) a Sala 202 a través del diálogo `AssignSpaceDialog`.
 * Identificamos la fila por la presencia del texto "Sin asignar" y un tipo
 * de elemento Proyector E2E.
 */
test.describe('Inventario: asignación de ítem a espacio', () => {
  test('admin asigna a Sala 202 el ítem que estaba sin asignar', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    const fila = page
      .locator('tr', { hasText: 'Proyector E2E' })
      .filter({ hasText: /Sin asignar/i })
      .first();
    await expect(fila).toBeVisible({ timeout: 10_000 });

    // El segundo botón de acciones es "Asignar" (icono Package).
    await fila.locator('button:has(svg.lucide-package)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Asignar Espacio/i)).toBeVisible();

    await dialog.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /^Sala 202/i }).click();

    await dialog.getByRole('button', { name: /^Asignar/i }).click();
    await expect(page.getByText(/asignado.*éxito|asignado.*exitosamente|Asignación.*exitosa/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

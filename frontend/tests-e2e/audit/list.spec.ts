import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin entra a `/audit` y ve la tabla de auditoría. Como por cada
 * entidad creada por el seeder (usuarios, espacios, reservas, ítems,
 * carreras) se persiste un log CREATE, al menos una fila debe estar
 * presente en la primera página. Validamos el heading y la presencia de
 * al menos una badge de acción (CREATE / UPDATE / DELETE).
 */
test.describe('Auditoría: listado', () => {
  test('admin entra a /audit y ve registros en la tabla', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/audit');
    await page.waitForURL('**/audit');

    await expect(page.getByRole('heading', { name: /Auditoría del Sistema/i }))
      .toBeVisible({ timeout: 15_000 });

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
    // Las badges del componente muestran las acciones traducidas:
    // "Crear", "Actualizar" o "Eliminar".
    await expect(page.locator('tbody').getByText(/Crear|Actualizar|Eliminar/i).first())
      .toBeVisible();
  });
});

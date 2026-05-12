import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `EditUserDialog` permite al admin actualizar el nombre y email de un
 * usuario. Editamos el "externo e2e" seedeado (no participa en tests
 * posteriores) cambiándole el nombre y verificamos que la tabla refleja
 * el cambio.
 */
test.describe('Usuarios: edición de perfil por el admin', () => {
  test('admin renombra al usuario externo y la tabla actualiza la fila', async ({ page }) => {
    const nuevoNombre = `Externo editado ${Date.now()}`;

    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const fila = page.locator('tr', { hasText: 'externo@e2e.test' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.getByRole('button', { name: /^Editar$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Editar Usuario/i).first()).toBeVisible();
    await dialog.getByLabel(/Nombre Completo/i).fill(nuevoNombre);
    await dialog.getByRole('button', { name: /Guardar Cambios/i }).click();

    await expect(page.getByText(new RegExp(nuevoNombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

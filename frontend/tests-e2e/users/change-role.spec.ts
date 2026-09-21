import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin abre el diálogo "Cambiar rol de usuario" desde la fila del
 * externo seedeado y le cambia el rol a MANTENIMIENTO. Verifica el toast
 * de éxito. Apuntamos a `externo` porque no participa en tests
 * posteriores; el cambio queda en la base sin afectar otros flujos.
 */
test.describe('Usuarios: cambio de rol', () => {
  test('admin cambia el rol del externo a Mantenimiento', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const fila = page.locator('tr', { hasText: 'externo@e2e.test' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.getByRole('button', { name: /^Cambiar rol$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Cambiar rol de usuario/i)).toBeVisible();
    await dialog.getByRole('combobox', { name: /Nuevo rol/i }).click();
    await page.getByRole('option', { name: /^Mantenimiento$/i }).click();
    await dialog.getByRole('button', { name: /Guardar cambios/i }).click();

    await expect(page.getByText(/Rol actualizado/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

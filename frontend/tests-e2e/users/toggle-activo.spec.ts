import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin desactiva un usuario desde el `Switch` de la fila. La acción
 * dispara un `AlertDialog` de confirmación; al confirmar, el toast
 * "Usuario desactivado" debe aparecer. Usamos al externo seedeado para no
 * afectar otros tests (corre tras `change-role` alfabéticamente, pero
 * ninguno de los dos rompe la sesión).
 */
test.describe('Usuarios: activar / desactivar', () => {
  test('admin desactiva al usuario externo y confirma en el AlertDialog', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const fila = page.locator('tr', { hasText: 'externo@e2e.test' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button[role="switch"]').first().click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText(/Desactivar usuario/i)).toBeVisible();
    await confirm.getByRole('button', { name: /^Confirmar$/i }).click();

    await expect(page.getByText(/Usuario desactivado|desactivad/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

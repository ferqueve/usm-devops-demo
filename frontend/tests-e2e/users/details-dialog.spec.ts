import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El botón "Ver" de cada fila abre el "Detalles del Usuario", un diálogo
 * de solo lectura con email, rol, estado y demás campos del usuario.
 * Apuntamos al docente seedeado para tener una fila estable que ninguna
 * otra prueba de `/users` muta.
 */
test.describe('Usuarios: diálogo de detalles', () => {
  test('admin abre el detalle del docente y ve sus campos', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const fila = page.locator('tr', { hasText: 'docente@e2e.test' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.getByRole('button', { name: /^Ver$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Detalles del Usuario/i)).toBeVisible();
    await expect(dialog.getByText(/docente@e2e\.test/i)).toBeVisible();
    await expect(dialog.getByText(/Docente/i).first()).toBeVisible();
  });
});

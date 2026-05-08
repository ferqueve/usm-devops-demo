import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cerrar sesión desde el sidebar: el usuario sale a /auth y el almacenamiento
 * local queda limpio de tokens.
 */
test.describe('Logout E2E', () => {
  test('admin cierra sesión y vuelve a la pantalla de login', async ({ page }) => {
    await loginAs(page, 'admin');

    // Esperamos a que el dashboard quede establecido para evitar que un
    // 401 latente de algún fetch del layout dispare el auto-logout antes
    // de que pulsemos el botón explícitamente.
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /cerrar sesión/i }).click();

    await page.waitForURL('**/auth');
    expect(page.url()).toContain('/auth');

    const token = await page.evaluate(() => globalThis.localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

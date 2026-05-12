import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `UserStatsCards` carga `/usuarios/stats` y muestra cards con totales y
 * desglose (verificados, activos, por rol). Verificamos que las
 * etiquetas principales aparezcan al ingresar a `/users` como admin.
 */
test.describe('Usuarios: tarjetas de estadísticas', () => {
  test('admin ve las stats de usuarios en /users', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    await expect(page.getByText(/Total Usuarios/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Verificados/i).first()).toBeVisible();
  });
});

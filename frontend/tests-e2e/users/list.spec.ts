import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin entra a `/users` y ve el listado con los seis usuarios
 * seedeados (uno por rol). Valida que la vista carga y que aparecen
 * referencias visibles a cada uno.
 */
test.describe('Usuarios: listado', () => {
  test('admin ve los seis usuarios seedeados', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    for (const email of [
      'admin@e2e.test',
      'analista@e2e.test',
      'docente@e2e.test',
      'estudiante@e2e.test',
      'externo@e2e.test',
      'mantenimiento@e2e.test',
    ]) {
      await expect(page.getByText(email).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});

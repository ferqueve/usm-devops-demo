import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Tras un login exitoso, el token queda en `localStorage`. Al recargar la
 * página el usuario debe seguir autenticado: `AuthProvider` lo recupera y
 * `RoleProtectedRoute` no debe redirigir a `/auth`. Validamos que tras
 * `page.reload()` el admin sigue en `/dashboard`.
 */
test.describe('Auth: sesión persiste tras recargar', () => {
  test('admin recarga /dashboard y sigue logueado', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.reload();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
    // Verificamos que el panel principal del dashboard se renderiza.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 10_000 });
  });
});

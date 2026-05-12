import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Solo el rol ADMIN tiene `auditoria:ver` y `/audit` en sus rutas
 * permitidas. Validamos que el analista (el rol con más permisos después
 * de ADMIN) sea redirigido por `RoleProtectedRoute` al intentar entrar.
 */
test.describe('Auditoría: control de acceso por rol', () => {
  test('analista es redirigido fuera de /audit', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/audit');
    await page.waitForURL((url) => !url.pathname.startsWith('/audit'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/audit');
  });
});

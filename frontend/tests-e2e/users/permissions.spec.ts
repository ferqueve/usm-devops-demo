import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Sólo el rol ADMIN tiene `usuario:gestionar` y `/users` en sus rutas
 * permitidas. Validamos que el analista (el siguiente rol "más alto")
 * sea redirigido por `RoleProtectedRoute` al intentar entrar.
 * `permissions/student-blocked` ya cubre el mismo caso para estudiante.
 */
test.describe('Usuarios: control de acceso por rol', () => {
  test('analista es redirigido fuera de /users', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/users');
    await page.waitForURL((url) => !url.pathname.startsWith('/users'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/users');
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol ESTUDIANTE solo tiene permitidas /dashboard y /calendar
 * (`frontend/src/lib/config/constants.ts`). Al intentar entrar a /users,
 * RoleProtectedRoute lo redirige a la primera ruta permitida (/dashboard).
 */
test.describe('Permisos: estudiante bloqueado en rutas administrativas', () => {
  test('al navegar a /users, estudiante es redirigido fuera de /users', async ({ page }) => {
    await loginAs(page, 'estudiante');
    await page.goto('/users');
    await page.waitForURL((url) => !url.pathname.startsWith('/users'));
    expect(page.url()).not.toContain('/users');
  });
});

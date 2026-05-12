import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cuando el backend responde 401 a una petición autenticada, el cliente
 * HTTP intenta refrescar el token; si el refresh también falla, dispatcha
 * el evento `auth:logout`, limpia localStorage y `RoleProtectedRoute`
 * redirige al login. Simulamos este escenario interceptando todas las
 * llamadas a la API con un 401 y verificamos que tras navegar a una ruta
 * protegida el usuario termina fuera de ella.
 */
test.describe('Auth: auto-logout ante 401 del backend', () => {
  test('admin queda deslogueado si el backend responde 401 a sus requests', async ({ page }) => {
    await loginAs(page, 'admin');

    // Interceptar TODAS las llamadas a /api/* devolviendo 401.
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Sesión expirada' }),
      });
    });

    // Navegar a una ruta protegida que dispare requests autenticados.
    await page.goto('/reservations');

    // El interceptor agota el refresh y termina disparando `auth:logout`;
    // RoleProtectedRoute lleva al usuario a /auth (o /login).
    await page.waitForURL((url) => /\/auth(\/|$)|\/login(\/|$)/.test(url.pathname), {
      timeout: 15_000,
    });
    expect(page.url()).toMatch(/\/auth|\/login/);
  });
});

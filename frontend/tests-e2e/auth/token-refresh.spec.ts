import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cuando el backend devuelve 401 a una petición autenticada, el cliente
 * HTTP intenta refrescar el token contra `/auth/refresh` y, si lo logra,
 * reintenta la petición original. Simulamos un 401 puntual sobre
 * `/reservas/mis-reservas/paged` (solo en la primera llamada) y dejamos
 * que el refresh + retry sigan al backend real. El usuario debe quedar
 * en `/reservations`, sin redirección al login.
 */
test.describe('Auth: refresh exitoso tras 401', () => {
  test('docente recibe 401 puntual, refresh tiene éxito y termina en /reservations', async ({ page }) => {
    await loginAs(page, 'docente');

    let intercepted = false;
    await page.route('**/api/v1/reservas/mis-reservas**', async (route) => {
      if (!intercepted) {
        intercepted = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Token expirado' }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/reservations');

    // Tras refresh + retry el listado vuelve a renderizar; el header propio
    // de la página de docente confirma que seguimos autenticados.
    await expect(page.getByRole('heading', { name: /Mis Solicitudes/i }).first())
      .toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/reservations');
  });
});

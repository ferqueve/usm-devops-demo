import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El estudiante no tiene `/reservations` en su lista de rutas permitidas
 * (ver `ROLE_PERMISSIONS.ESTUDIANTE.routes` en `constants.ts`). Su acceso
 * a información de reservas se limita a `/calendar`. Validamos ambos
 * extremos: redirección al intentar entrar a /reservations y ausencia
 * de botón "Nueva Reserva" en /calendar.
 */
test.describe('Reservas: estudiante en modo solo lectura', () => {
  test('estudiante es redirigido fuera de /reservations y no ve crear en /calendar', async ({ page }) => {
    await loginAs(page, 'estudiante');

    await page.goto('/reservations');
    // RoleProtectedRoute redirige a la primera ruta permitida (/dashboard).
    await page.waitForURL((url) => !url.pathname.startsWith('/reservations'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/reservations');

    // En /calendar puede leer pero no crear.
    await page.goto('/calendar');
    await page.waitForURL('**/calendar');
    expect(await page.getByRole('button', { name: /Nueva Reserva|Nueva Solicitud|Solicitar/i }).count()).toBe(0);
  });
});

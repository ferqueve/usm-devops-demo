import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El dashboard del docente trae los accesos a sus reservas: el bloque "Mis
 * reservas" con el link "nueva reserva" y la tarjeta "Hoy" que lleva al
 * calendario. Validamos que ambos accesos estén y apunten a su ruta.
 */
test.describe('Dashboard: accesos rápidos del docente', () => {
  test('docente ve los accesos a "nueva reserva" y al calendario', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.waitForURL('**/dashboard');

    await expect(page.getByRole('heading', { name: /^Mis reservas$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /^nueva reserva$/i }))
      .toHaveAttribute('href', /\/reservations\?new=true/);
    await expect(page.getByRole('link', { name: /^Hoy/i }).first()).toHaveAttribute('href', '/calendar');
  });
});

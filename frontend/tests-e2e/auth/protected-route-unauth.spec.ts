import { test, expect } from '@playwright/test';

/**
 * Las rutas protegidas no son accesibles sin sesión. Sin cookies ni token
 * en `localStorage`, una visita directa a `/reservations` debe terminar
 * fuera de esa ruta (típicamente `/auth` o `/login` según el alias).
 */
test.describe('Auth: ruta protegida sin sesión', () => {
  test('un visitante sin login no entra a /reservations', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/auth');
    await page.evaluate(() => globalThis.localStorage.clear());

    await page.goto('/reservations');
    await page.waitForTimeout(2_000);

    expect(page.url()).not.toMatch(/\/reservations(\/|$)/);
  });
});

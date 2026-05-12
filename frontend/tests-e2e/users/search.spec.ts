import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Búsqueda por email o nombre. El input dispara la query con un debounce;
 * al tipear "estudiante" solo el usuario estudiante seedeado debe quedar
 * en la tabla.
 */
test.describe('Usuarios: búsqueda', () => {
  test('admin filtra por "estudiante" y solo ve ese usuario', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    await page.getByPlaceholder(/Buscar por email o nombre/i).fill('estudiante');
    await page.waitForTimeout(800);

    // El email del admin aparece en el sidebar (perfil del usuario logueado),
    // así que limitamos las aserciones al área principal (tabla/cards).
    const main = page.locator('main');
    await expect(main.getByText('estudiante@e2e.test').first()).toBeVisible({ timeout: 10_000 });
    expect(await main.getByText('admin@e2e.test').count()).toBe(0);
    expect(await main.getByText('docente@e2e.test').count()).toBe(0);
  });
});

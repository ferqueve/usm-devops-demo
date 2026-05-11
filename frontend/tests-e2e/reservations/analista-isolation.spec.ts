import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El sidebar "Pendientes" de /reservations filtra por `analistaId === user.id`:
 * cada analista solo ve las reservas pendientes que le fueron asignadas. El
 * seeder asigna "Charla docente E2E" al usuario ANALISTA, mientras que las
 * otras dos pendientes ("Reunión de proyecto E2E" y "Sesión de laboratorio
 * E2E") están asignadas al ADMIN. Validamos ambos extremos.
 */
test.describe('Reservas: analista solo ve pendientes asignadas a él', () => {
  test('analista ve "Charla docente E2E" pero no las pendientes del admin', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    // Esperamos a que el panel de pendientes cargue.
    await expect(page.getByText('Charla docente E2E').first()).toBeVisible({ timeout: 15_000 });

    // Las pendientes que pertenecen al admin no aparecen en el sidebar del
    // analista. (`Reunión de proyecto E2E` y `Sesión de laboratorio E2E`
    // están asignadas al admin como analistaAsignado.)
    const sidebar = page.locator('section, aside, div').filter({ hasText: /Pendientes/i }).first();
    expect(await sidebar.getByText('Reunión de proyecto E2E').count()).toBe(0);
    expect(await sidebar.getByText('Sesión de laboratorio E2E').count()).toBe(0);
  });
});

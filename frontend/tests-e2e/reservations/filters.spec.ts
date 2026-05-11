import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por estado en /reservations: el docente activa el filtro de
 * "Aprobadas" y verifica que solo aparece la APROBADA sembrada
 * ("Clase abierta E2E"), no la pendiente ("Sesión de laboratorio E2E").
 */
test.describe('Reservas: filtros del listado', () => {
  test('docente filtra por APROBADO y solo ve sus aprobadas', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    // Vista tabla para tener filas predecibles.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // Click en el filtro de aprobadas (icono CheckCircle2 = lucide-circle-check).
    await page.locator('button:has(svg.lucide-circle-check)').first().click();

    // Esperamos que la lista se actualice.
    await page.waitForTimeout(500);

    // Solo la APROBADA está visible.
    await expect(page.getByText('Clase abierta E2E').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Sesión de laboratorio E2E').count()).toBe(0);
  });
});

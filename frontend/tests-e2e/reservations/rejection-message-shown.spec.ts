import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Continuidad de `admin-reject.spec.ts`: una vez que el admin rechazó
 * "Sesión de laboratorio E2E" con el mensaje "Conflicto con otra actividad
 * ya programada", el docente dueño abre el detalle de esa misma reserva
 * (ahora CANCELADA) y verifica que el mensaje del analista persiste y se
 * renderiza en el panel correspondiente. Este test depende del orden
 * alfabético: corre después de `admin-reject` (a < r) sobre la misma
 * sesión Playwright.
 */
test.describe('Reservas: mensaje del analista persiste tras rechazo', () => {
  test('docente abre la reserva cancelada y ve el motivo del rechazo', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    const fila = page.locator('tr', { hasText: 'Sesión de laboratorio E2E' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-eye)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Mensaje del analista/i)).toBeVisible();
    await expect(dialog.getByText(/Conflicto con otra actividad ya programada/i)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El filtro de rango de fechas en /reservations es un par de calendarios
 * pop-over. El docente fija inicio y fin en "mañana", lo que debería dejar
 * solo las reservas de mañana (Reunión de proyecto E2E, Clase abierta E2E,
 * Sesión de laboratorio E2E, Charla docente E2E) y excluir las históricas
 * y la "Tutoría pasada E2E" de ayer.
 */
test.describe('Reservas: filtro por rango de fechas', () => {
  test('docente fija el rango a mañana y oculta las reservas pasadas', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // Rango [mañana, pasado-mañana] para abarcar las reservas seedeadas de
    // mañana sin importar la conversión a UTC del filtro (que usa medianoche
    // local como cota).
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const diaInicio = String(manana.getDate());
    const pasado = new Date();
    pasado.setDate(pasado.getDate() + 2);
    const diaFin = String(pasado.getDate());

    // Botón fecha inicio (CalendarArrowDown).
    await page.locator('button:has(svg.lucide-calendar-arrow-down)').first().click();
    await page
      .getByRole('dialog')
      .locator('[role="gridcell"] button:not([disabled])')
      .filter({ hasText: new RegExp(`^${diaInicio}$`) })
      .first()
      .click();

    // Botón fecha fin (CalendarArrowUp).
    await page.locator('button:has(svg.lucide-calendar-arrow-up)').first().click();
    await page
      .getByRole('dialog')
      .locator('[role="gridcell"] button:not([disabled])')
      .filter({ hasText: new RegExp(`^${diaFin}$`) })
      .first()
      .click();

    await page.waitForTimeout(500);

    await expect(page.getByText('Clase abierta E2E').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Tutoría pasada E2E').count()).toBe(0);
    expect(await page.getByText('Histórico 2 E2E').count()).toBe(0);
  });
});

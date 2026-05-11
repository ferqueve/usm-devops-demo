import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por espacio en /reservations: el docente abre el selector de
 * espacios y elige "Sala 202". El listado debe filtrar a las reservas que
 * pertenecen a esa sala. El seeder pone "Clase abierta E2E" y "Tutoría
 * pasada E2E" en Sala 202, y todo el resto (incluida "Reunión de proyecto
 * E2E") en Sala 101.
 */
test.describe('Reservas: filtro por espacio', () => {
  test('docente filtra por Sala 202 y solo ve reservas de esa sala', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // El filtro de espacios se activa con el botón que contiene un ícono
    // building-2 dentro de la sección de filtros.
    await page.locator('button:has(svg.lucide-building-2)').first().click();

    // Popover con la lista de espacios; clickeamos Sala 202.
    await page.getByRole('button', { name: /^Sala 202$/i }).first().click();

    await page.waitForTimeout(500);

    // Solo deberíamos ver reservas de Sala 202.
    await expect(page.getByText('Clase abierta E2E').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Reunión de proyecto E2E').count()).toBe(0);
    expect(await page.getByText('Histórico 2 E2E').count()).toBe(0);
  });
});

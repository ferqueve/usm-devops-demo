import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro temporal de /reservations: el docente activa "Reservas pasadas" y
 * verifica que aparezcan "Tutoría pasada E2E" e "Histórico 2 E2E" mientras
 * desaparece la "Clase abierta E2E" futura. El ícono `lucide-clock`
 * también se usa en cada fila de la tabla, así que disambiguamos
 * apuntando al primero, que vive en el panel de filtros (renderizado
 * antes que la grilla en el DOM).
 */
test.describe('Reservas: filtro temporal futuras / pasadas', () => {
  test('docente activa "pasadas" y solo aparecen reservas anteriores a hoy', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('button:has(svg.lucide-clock)').first().click();
    await page.waitForTimeout(700);

    await expect(page.getByText('Tutoría pasada E2E').first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByText('Clase abierta E2E').count()).toBe(0);
  });
});

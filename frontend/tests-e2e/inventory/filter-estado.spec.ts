import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtro por estado en /inventory: al elegir "Mantenimiento" en el select
 * `#estado-filter` solo se ven los ítems en ese estado. El seeder genera
 * un único ítem MANTENIMIENTO (Proyector E2E en Sala 202), por lo que la
 * tabla debe mostrar exactamente esa fila y ocultar los DISPONIBLE.
 */
test.describe('Inventario: filtro por estado', () => {
  test('admin filtra por MANTENIMIENTO y solo ve el ítem correspondiente', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    // Esperar a que cargue al menos una fila.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('#estado-filter').click();
    await page.getByRole('option', { name: /^Mantenimiento$/i }).click();
    await page.waitForTimeout(700);

    // La única fila visible debe ser Proyector E2E en Sala 202.
    const filas = page.locator('tbody tr');
    expect(await filas.count()).toBeGreaterThan(0);
    await expect(page.locator('tr', { hasText: 'Proyector E2E' }).filter({ hasText: 'Sala 202' }).first())
      .toBeVisible();
    // No deben aparecer las DISPONIBLE: Sala 101 ni "Sin asignar".
    expect(await page.locator('tbody tr').filter({ hasText: 'Sin asignar' }).count()).toBe(0);
  });
});

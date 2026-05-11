import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Filtros del panel `/inventory/requests`. El componente
 * `InventoryRequestFilters` permite seleccionar uno o varios estados; el
 * filtro envía un parámetro `estado` por cada valor seleccionado.
 * Activamos "Aprobado" y verificamos que las solicitudes Pendiente
 * desaparezcan del listado (el orden alfabético de los tests deja las
 * dos solicitudes seedeadas en PENDIENTE al momento de correrse).
 */
test.describe('Inventario: filtros de solicitudes', () => {
  test('admin filtra por APROBADO y oculta las solicitudes pendientes', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory/requests');
    await page.waitForURL('**/inventory/requests');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // Sanity check: hay al menos una pendiente seedeada.
    await expect(page.locator('tbody tr').filter({ hasText: 'Pendiente' }).first())
      .toBeVisible({ timeout: 10_000 });

    // Botón del filtro de estado "Aprobado" — ícono CheckCircle2 (lucide-circle-check).
    await page.locator('button:has(svg.lucide-circle-check)').first().click();
    await page.waitForTimeout(700);

    // Sin solicitudes Aprobadas a esta altura, el listado queda vacío y las
    // Pendientes ya no aparecen.
    expect(await page.locator('tbody tr').filter({ hasText: 'Pendiente' }).count()).toBe(0);
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Paginación en la vista de tabla. El seeder genera 14 reservas para el
 * docente (2 pendientes + 1 pendiente asignada al analista + 1 aprobada
 * futura + 1 pasada + 9 históricas). Con `pageSize=10` por defecto, el
 * listado paginado entrega dos páginas. Verificamos que aparezca el control
 * de paginación y que la página 2 traiga al menos una fila distinta.
 */
test.describe('Reservas: paginación del listado', () => {
  test('docente ve dos páginas y la página 2 trae filas distintas', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // Esperamos a que la tabla cargue.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    const titulosPagina1 = await page.locator('tbody tr').allInnerTexts();
    expect(titulosPagina1.length).toBeGreaterThan(0);

    // El paginador usa shadcn/ui Pagination: cada página es un `<a>` con su
    // número como texto. Click en "2" para ir a la segunda página.
    const linkPagina2 = page.getByRole('link', { name: /^2$/ }).first();
    await expect(linkPagina2).toBeVisible({ timeout: 10_000 });
    await linkPagina2.click();
    await page.waitForTimeout(700);

    const titulosPagina2 = await page.locator('tbody tr').allInnerTexts();
    expect(titulosPagina2.length).toBeGreaterThan(0);

    // Al menos una fila debe ser distinta entre páginas.
    const interseccion = titulosPagina1.filter(t => titulosPagina2.includes(t));
    expect(interseccion.length).toBeLessThan(titulosPagina1.length);
  });
});

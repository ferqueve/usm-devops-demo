import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Control de acceso sobre /inventory:
 *  - El analista entra a la página pero, al no tener `inventario:crear`,
 *    `inventario:editar` ni `inventario:eliminar`, no ve los botones
 *    "Agregar Item", "Gestionar Tipos" ni los íconos de editar/eliminar.
 *  - El docente no tiene la ruta `/inventory` en su lista de routes
 *    permitidas (ver `ROLE_PERMISSIONS.DOCENTE` en `constants.ts`), por lo
 *    que `RoleProtectedRoute` lo redirige fuera.
 */
test.describe('Inventario: control de acceso por rol', () => {
  test('analista ve el listado pero sin botones de gestión', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    expect(await page.getByRole('button', { name: /Agregar Item/i }).count()).toBe(0);
    expect(await page.getByRole('button', { name: /Gestionar Tipos/i }).count()).toBe(0);
    // No hay botones de editar (lucide-square-pen) ni eliminar (lucide-trash-2)
    // dentro de las filas.
    expect(await page.locator('tbody button:has(svg.lucide-square-pen)').count()).toBe(0);
    expect(await page.locator('tbody button:has(svg.lucide-trash-2)').count()).toBe(0);
  });

  test('docente es redirigido fuera de /inventory', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/inventory');
    await page.waitForURL((url) => !url.pathname.startsWith('/inventory'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/inventory');
  });
});

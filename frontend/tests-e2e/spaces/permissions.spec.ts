import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Control de acceso sobre `/rooms`. El analista entra al listado pero, al
 * carecer de `espacio:crear`/`:editar`/`:eliminar`, no debe ver los
 * botones de gestión. El docente directamente no tiene `/rooms` entre sus
 * rutas permitidas (`ROLE_PERMISSIONS.DOCENTE`), por lo que
 * `RoleProtectedRoute` lo redirige.
 */
test.describe('Espacios: control de acceso por rol', () => {
  test('analista ve el listado pero no los botones de gestión', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await expect(page.getByText(/Sala 101/i).first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByRole('button', { name: /Agregar Espacio/i }).count()).toBe(0);
    expect(await page.getByRole('button', { name: /Tipos de Espacios/i }).count()).toBe(0);
  });

  test('docente es redirigido fuera de /rooms', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/rooms');
    await page.waitForURL((url) => !url.pathname.startsWith('/rooms'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/rooms');
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol MANTENIMIENTO tiene CRUD completo sobre el inventario
 * (`inventario:crear`, `:editar`, `:eliminar`, `:asignar`) y acceso a la
 * ruta `/inventory/requests`. Verificamos que ve los botones de gestión
 * en `/inventory` (Agregar Item, Gestionar Tipos) y que puede entrar al
 * panel de solicitudes.
 */
test.describe('Inventario: rol MANTENIMIENTO gestiona inventario', () => {
  test('mantenimiento ve los botones de gestión y accede a /inventory/requests', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await expect(page.getByRole('button', { name: /Agregar Item/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Gestionar Tipos/i }).first()).toBeVisible();

    await page.goto('/inventory/requests');
    await page.waitForURL('**/inventory/requests');
    await expect(page).toHaveURL(/\/inventory\/requests$/);
  });
});

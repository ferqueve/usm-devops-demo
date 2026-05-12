import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Vista detalle de un espacio en `/rooms/:id`. El admin clickea "Ver
 * Detalles" en la card de Sala 101 y verifica que la página de detalle
 * carga con nombre, badge de estado, tipo y sección de inventario.
 */
test.describe('Espacios: vista detalle', () => {
  test('admin abre el detalle de Sala 101 y ve sus campos principales', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    // La card de Sala 101 dispara `handleViewDetails` al clickear cualquier
    // parte; el título es el texto más estable para apuntarla.
    const titulo = page.getByText('Sala 101', { exact: true }).first();
    await expect(titulo).toBeVisible({ timeout: 10_000 });
    await titulo.click();

    await page.waitForURL(/\/rooms\/\d+$/);
    await expect(page.getByRole('heading', { name: /^Sala 101$/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Disponible/i).first()).toBeVisible();
    await expect(page.getByText(/Sala E2E/i).first()).toBeVisible();
    // La sección de inventario tiene dos vistas (cards en mobile, tabla en
    // desktop). Apuntamos a la celda de la tabla, que es la visible en el
    // viewport por defecto de Playwright (desktop).
    await expect(page.locator('table').getByText(/Proyector E2E/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

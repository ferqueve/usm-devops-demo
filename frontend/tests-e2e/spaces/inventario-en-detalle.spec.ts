import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * En la pantalla de detalle de un espacio (`/rooms/:id`) se puede gestionar
 * el inventario asociado sin salir de la página. El test navega al detalle
 * de Sala 101, abre `InventarioFormDialog` con el botón "Agregar Elemento",
 * carga un Notebook E2E DISPONIBLE de cantidad 3 y verifica que la nueva
 * fila aparezca en la tabla del bloque "Inventario del Espacio".
 */
test.describe('Espacios: inventario gestionado desde el detalle', () => {
  test('admin agrega un Notebook E2E al inventario de Sala 101', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    // Entrar al detalle de Sala 101 (la card es clickeable como un todo).
    await page.getByText('Sala 101', { exact: true }).first().click();
    await page.waitForURL(/\/rooms\/\d+$/);
    await expect(page.getByRole('heading', { name: /^Sala 101$/ })).toBeVisible({ timeout: 10_000 });

    // Abrir el diálogo de alta de elemento.
    await page.getByRole('button', { name: /Agregar Elemento/i }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: /Agregar Elemento de Inventario/i });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Tipo de Elemento/i).click();
    await page.getByRole('option', { name: /^Notebook E2E$/i }).click();
    await dialog.getByLabel(/Cantidad/i).fill('3');
    // Estado por defecto DISPONIBLE; no hace falta tocarlo.

    await dialog.getByRole('button', { name: /^Agregar$/i }).click();
    await expect(page.getByText(/Elemento agregado exitosamente/i).first()).toBeVisible({ timeout: 10_000 });

    // La fila del Notebook E2E aparece en la tabla del detalle.
    await expect(page.locator('table').getByText(/Notebook E2E/i).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

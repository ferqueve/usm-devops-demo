import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin cambia el estado de un espacio creado on-the-fly de DISPONIBLE
 * a MANTENIMIENTO. La transición se hace desde el mismo `SpaceFormDialog`
 * en modo edición (campo Select "Estado").
 */
test.describe('Espacios: cambio de estado', () => {
  test('admin pasa un espacio de DISPONIBLE a MANTENIMIENTO', async ({ page }) => {
    const nombre = `Estado E2E ${Date.now()}`;

    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /Agregar Espacio/i }).first().click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Nombre del Espacio/i).fill(nombre);
    await dialog.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^Sala E2E$/i }).click();
    await dialog.getByLabel(/Capacidad/i).fill('12');
    await dialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Editar y cambiar estado.
    await page.locator('button:has(svg.lucide-layout-list)').first().click();
    const fila = page.locator('tr', { hasText: nombre }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();

    dialog = page.getByRole('dialog');
    // El select de Estado es el segundo combobox del diálogo.
    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /En Mantenimiento/i }).click();
    await dialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // La fila ahora muestra el estado "Mantenimiento".
    const filaActualizada = page.locator('tr', { hasText: nombre }).first();
    await expect(filaActualizada).toContainText(/Mantenimiento/i);
  });
});

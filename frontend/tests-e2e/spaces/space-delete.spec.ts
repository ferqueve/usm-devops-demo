import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin elimina un espacio. El test crea uno temporal y, desde la fila,
 * dispara el `DeleteSpaceDialog` que pide confirmación antes de borrar.
 */
test.describe('Espacios: borrado de espacio', () => {
  test('admin elimina un espacio recién creado tras confirmar', async ({ page }) => {
    const nombre = `Borrar E2E ${Date.now()}`;

    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /Agregar Espacio/i }).first().click();
    const formDialog = page.getByRole('dialog');
    await formDialog.getByLabel(/Nombre del Espacio/i).fill(nombre);
    await formDialog.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^Sala E2E$/i }).click();
    await formDialog.getByLabel(/Capacidad/i).fill('5');
    await formDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(formDialog).not.toBeVisible({ timeout: 10_000 });

    // Vista tabla → fila → botón eliminar.
    await page.locator('button:has(svg.lucide-layout-list)').first().click();
    const fila = page.locator('tr', { hasText: nombre }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-trash-2)').first().click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText(/Eliminar Espacio/i)).toBeVisible();
    await confirm.getByRole('button', { name: /^Eliminar$/i }).click();

    await expect(page.getByText(/Espacio eliminado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('tr', { hasText: nombre })).toHaveCount(0, { timeout: 5_000 });
  });
});

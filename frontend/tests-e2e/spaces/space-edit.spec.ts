import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin edita un espacio. El test arranca creando uno temporal con
 * timestamp (para no chocar con las salas usadas por otros tests), abre el
 * diálogo "Editar Espacio" desde la fila, cambia la capacidad y verifica
 * que la nueva capacidad se refleja en la tabla.
 */
test.describe('Espacios: edición de espacio', () => {
  test('admin edita la capacidad de un espacio recién creado', async ({ page }) => {
    const nombre = `Editar E2E ${Date.now()}`;

    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    // Crear espacio de soporte.
    await page.getByRole('button', { name: /Agregar Espacio/i }).first().click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Nombre del Espacio/i).fill(nombre);
    await dialog.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^Sala E2E$/i }).click();
    await dialog.getByLabel(/Capacidad/i).fill('10');
    await dialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Vista de tabla para encontrar la fila por nombre y editarla.
    await page.locator('button:has(svg.lucide-layout-list)').first().click();
    const fila = page.locator('tr', { hasText: nombre }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Editar Espacio/i)).toBeVisible();
    await dialog.getByLabel(/Capacidad/i).fill('42');
    await dialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Espacio actualizado|actualizado.*éxito/i).first())
      .toBeVisible({ timeout: 10_000 });

    const filaActualizada = page.locator('tr', { hasText: nombre }).first();
    await expect(filaActualizada).toContainText('42');
  });
});

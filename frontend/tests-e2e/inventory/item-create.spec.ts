import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin crea un nuevo ítem de inventario desde el diálogo "Agregar Item de
 * Inventario". Cubre el flujo principal del módulo: selección de espacio, tipo
 * de elemento, cantidad, estado y observaciones, persistencia y aparición en
 * la tabla con los valores enviados.
 */
test.describe('Inventario: alta de ítem', () => {
  test('admin agrega un ítem y aparece en la tabla', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await page.getByRole('button', { name: /Agregar Item/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Agregar Item de Inventario/i)).toBeVisible();

    // Espacio
    await dialog.getByLabel(/^Espacio \*$/i).click();
    await page.getByRole('option', { name: /^Sala 202$/i }).click();

    // Tipo de elemento
    await dialog.getByLabel(/Tipo de Elemento \*/i).click();
    await page.getByRole('option', { name: /^Notebook E2E$/i }).click();

    // Cantidad
    const cantidad = await dialog.getByLabel(/Cantidad \*/i);
    await cantidad.fill('7');

    // Estado: DANADO para no chocar con filtros futuros sobre DISPONIBLE.
    await dialog.getByLabel(/Estado \*/i).click();
    await page.getByRole('option', { name: /^Dañado$/i }).click();

    const observaciones = `Alta E2E ${Date.now()}`;
    await dialog.getByLabel(/Observaciones/i).fill(observaciones);

    await dialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/creado.*éxito|creado.*exitosamente/i).first()).toBeVisible({ timeout: 10_000 });

    // La tabla muestra al menos una fila Notebook E2E en Sala 202 con cantidad 7.
    const fila = page.locator('tr', { hasText: 'Notebook E2E' }).filter({ hasText: 'Sala 202' }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await expect(fila).toContainText('7');
  });
});

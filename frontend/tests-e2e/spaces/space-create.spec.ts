import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El admin crea un espacio nuevo desde `SpaceFormDialog`. Cubre el flujo
 * principal: completar nombre, tipo, capacidad, estado y guardar. La fila
 * recién creada debe aparecer en el listado.
 */
test.describe('Espacios: alta de espacio', () => {
  test('admin crea un espacio y aparece en el listado', async ({ page }) => {
    const nombre = `Sala E2E ${Date.now()}`;

    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /Agregar Espacio/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Crear Nuevo Espacio/i)).toBeVisible();

    await dialog.getByLabel(/Nombre del Espacio/i).fill(nombre);
    // El `<Label htmlFor>` no llega al SelectTrigger de Radix; los selects
    // se ubican por posición: primero Tipo, después Estado.
    await dialog.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^Sala E2E$/i }).click();
    await dialog.getByLabel(/Capacidad/i).fill('25');
    // Estado por defecto: DISPONIBLE.

    await dialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(new RegExp(`${nombre.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'i')).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

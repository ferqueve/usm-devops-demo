import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * CRUD de "Tipo de Elemento" desde el diálogo "Gestionar Tipos de Inventario".
 * El test crea un nuevo tipo, lo edita y luego lo desactiva. El backend hace
 * soft delete (`tipo.setActivo(false)`), así que el diálogo se llama
 * "Desactivar" y la fila queda visible con badge "Inactivo".
 */
test.describe('Inventario: CRUD de tipos de elemento', () => {
  test('admin crea, edita y desactiva un tipo de elemento', async ({ page }) => {
    const ts = Date.now();
    const nombreOriginal = `Camara E2E ${ts}`;
    const nombreEditado = `Camara E2E editada ${ts}`;

    await loginAs(page, 'admin');
    await page.goto('/inventory');
    await page.waitForURL('**/inventory');

    await page.getByRole('button', { name: /Gestionar Tipos/i }).first().click();
    const shellDialog = page.getByRole('dialog').filter({ hasText: /Gestionar Tipos de Inventario/i });
    await expect(shellDialog).toBeVisible();

    // ---- Crear ----
    await shellDialog.getByRole('button', { name: /^Crear Tipo$/i }).click();
    const formDialog = page.getByRole('dialog').filter({ hasText: /Crear Nuevo Tipo de Elemento/i });
    await expect(formDialog).toBeVisible();
    await formDialog.getByLabel(/Nombre del Tipo/i).fill(nombreOriginal);
    await formDialog.getByLabel(/Descripción/i).fill('Tipo creado por el test e2e');
    await formDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/Tipo de Elemento creado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shellDialog.getByText(nombreOriginal)).toBeVisible();

    // ---- Editar ----
    // Cada tipo se renderiza en una fila <div className="border rounded-lg">
    // con un <h3> con el nombre y, en el costado derecho, los botones de
    // editar/eliminar. Navegamos desde el heading al ancestor row.
    const fila = shellDialog
      .getByRole('heading', { name: nombreOriginal })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();
    const editDialog = page.getByRole('dialog').filter({ hasText: /Editar Tipo de Elemento/i });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(/Nombre del Tipo/i).fill(nombreEditado);
    await editDialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Tipo de Elemento actualizado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shellDialog.getByText(nombreEditado)).toBeVisible();

    // ---- Desactivar (soft delete) ----
    const filaEditada = shellDialog
      .getByRole('heading', { name: nombreEditado })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await filaEditada.locator('button:has(svg.lucide-trash-2)').first().click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^Desactivar$/i }).click();
    await expect(page.getByText(/Tipo de elemento desactivado/i).first()).toBeVisible({ timeout: 10_000 });
    // `useTiposElemento` solo trae los `activo=true`, así que la fila
    // desaparece del listado tras la desactivación.
    await expect(shellDialog.getByText(nombreEditado)).toHaveCount(0, { timeout: 5_000 });
  });
});

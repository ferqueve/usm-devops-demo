import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * CRUD de "Tipo de Espacio" desde el diálogo "Gestionar Tipos". El test
 * crea un tipo nuevo, lo edita y lo desactiva (soft delete). Sigue el
 * mismo patrón que `inventory/tipo-crud.spec.ts` porque ambos consumen
 * el shell genérico `TipoCrudShell`/`TipoFormDialogShell`.
 */
test.describe('Espacios: CRUD de tipos de espacio', () => {
  test('admin crea, edita y desactiva un tipo de espacio', async ({ page }) => {
    const ts = Date.now();
    const nombreOriginal = `Aula E2E ${ts}`;
    const nombreEditado = `Aula E2E editada ${ts}`;

    await loginAs(page, 'admin');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await page.getByRole('button', { name: /Tipos de Espacios/i }).first().click();
    const shellDialog = page.getByRole('dialog').filter({ hasText: /Tipos de Espacio/i });
    await expect(shellDialog).toBeVisible();

    // Crear.
    await shellDialog.getByRole('button', { name: /^Crear Tipo$/i }).click();
    let formDialog = page.getByRole('dialog').filter({ hasText: /Crear Nuevo Tipo de Espacio/i });
    await expect(formDialog).toBeVisible();
    await formDialog.getByLabel(/Nombre del Tipo/i).fill(nombreOriginal);
    await formDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/Tipo de Espacio creado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shellDialog.getByText(nombreOriginal)).toBeVisible();

    // Editar.
    const fila = shellDialog
      .getByRole('heading', { name: nombreOriginal })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();
    formDialog = page.getByRole('dialog').filter({ hasText: /Editar Tipo de Espacio/i });
    await formDialog.getByLabel(/Nombre del Tipo/i).fill(nombreEditado);
    await formDialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Tipo de Espacio actualizado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shellDialog.getByText(nombreEditado)).toBeVisible();

    // Desactivar (soft delete).
    const filaEditada = shellDialog
      .getByRole('heading', { name: nombreEditado })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await filaEditada.locator('button:has(svg.lucide-trash-2)').first().click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^Desactivar$/i }).click();
    await expect(page.getByText(/Tipo de espacio desactivado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shellDialog.getByText(nombreEditado)).toHaveCount(0, { timeout: 5_000 });
  });
});

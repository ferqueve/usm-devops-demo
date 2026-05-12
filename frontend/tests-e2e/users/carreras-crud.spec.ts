import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * CRUD completo de carreras desde el diálogo "Gestionar Carreras" montado
 * en `UserManagement`. El admin entra a `/users`, abre el modal, crea una
 * carrera con timestamp único, la edita y la elimina (soft delete). Sigue
 * el mismo patrón que `inventory/tipo-crud.spec.ts` y
 * `spaces/tipo-crud.spec.ts`.
 */
test.describe('Carreras: CRUD desde la gestión', () => {
  test('admin crea, edita y elimina una carrera', async ({ page }) => {
    const ts = Date.now();
    const nombre = `Carrera E2E ${ts}`;
    const nombreEditado = `Carrera E2E editada ${ts}`;

    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    await page.getByRole('button', { name: /Gestionar Carreras/i }).click();
    const shell = page.getByRole('dialog').filter({ hasText: /Gestionar Carreras/i });
    await expect(shell).toBeVisible({ timeout: 10_000 });

    // ---- Crear ----
    await shell.getByRole('button', { name: /^Crear Carrera$/i }).click();
    const createDialog = page.getByRole('dialog').filter({ hasText: /Crear Nueva Carrera/i });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/Nombre de la Carrera/i).fill(nombre);
    await createDialog.getByLabel(/Código/i).fill(`E2E-${ts}`);
    await createDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/Carrera creada/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shell.getByText(nombre)).toBeVisible();

    // ---- Editar ----
    const fila = shell
      .getByRole('heading', { name: nombre })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await fila.locator('button:has(svg.lucide-square-pen)').first().click();
    const editDialog = page.getByRole('dialog').filter({ hasText: /Editar Carrera/i });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(/Nombre de la Carrera/i).fill(nombreEditado);
    await editDialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Carrera actualizada/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shell.getByText(nombreEditado)).toBeVisible();

    // ---- Eliminar (soft delete) ----
    const filaEditada = shell
      .getByRole('heading', { name: nombreEditado })
      .locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await filaEditada.locator('button:has(svg.lucide-trash-2)').first().click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^Eliminar$/i }).click();
    await expect(page.getByText(/Carrera eliminada/i).first()).toBeVisible({ timeout: 10_000 });
    // La fila desaparece de la lista (`useCarreras().refresh()` recarga sin
    // los soft-deleted).
    await expect(shell.getByText(nombreEditado)).toHaveCount(0, { timeout: 5_000 });
  });
});

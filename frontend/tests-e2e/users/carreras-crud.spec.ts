import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * CRUD completo de carreras desde la sección "Carreras" de `/configuracion`.
 * El admin crea una carrera con timestamp único, la edita y la elimina
 * (soft delete). Sigue el mismo patrón que `inventory/tipo-crud.spec.ts` y
 * `spaces/tipo-crud.spec.ts`.
 */
test.describe('Carreras: CRUD desde la gestión', () => {
  test('admin crea, edita y elimina una carrera', async ({ page }) => {
    const ts = Date.now();
    const nombre = `Carrera E2E ${ts}`;
    const nombreEditado = `Carrera E2E editada ${ts}`;

    await loginAs(page, 'admin');
    await page.goto('/configuracion');
    await page.waitForURL('**/configuracion');
    await expect(page.getByRole('heading', { name: /^Carreras$/i })).toBeVisible({ timeout: 10_000 });

    // ---- Crear ----
    await page.getByRole('button', { name: /^Crear carrera$/i }).click();
    const createDialog = page.getByRole('dialog', { name: /Crear Nueva Carrera/i });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/Nombre de la Carrera/i).fill(nombre);
    await createDialog.getByLabel(/Código/i).fill(`E2E-${ts}`);
    await createDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/Carrera creada/i).first()).toBeVisible({ timeout: 10_000 });
    // La lista pagina de a 10: buscamos por el timestamp para no depender de
    // cuántas carreras haya.
    await page.getByPlaceholder(/Buscar en carreras/i).fill(String(ts));
    await expect(page.getByText(nombre, { exact: true })).toBeVisible();

    // ---- Editar ----
    await page.getByRole('button', { name: `Editar ${nombre}` }).click();
    const editDialog = page.getByRole('dialog', { name: /Editar Carrera/i });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(/Nombre de la Carrera/i).fill(nombreEditado);
    await editDialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Carrera actualizada/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(nombreEditado, { exact: true })).toBeVisible();

    // ---- Eliminar (soft delete) ----
    await page.getByRole('button', { name: `Eliminar ${nombreEditado}` }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^Eliminar$/i }).click();
    await expect(page.getByText(/Carrera eliminada/i).first()).toBeVisible({ timeout: 10_000 });
    // La fila desaparece de la lista (los soft-deleted no se listan).
    await expect(page.getByText(nombreEditado, { exact: true })).toHaveCount(0, { timeout: 5_000 });
  });
});

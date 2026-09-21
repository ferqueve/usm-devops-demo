import { test, expect, type Page } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * CRUD de tipos de elemento desde la sección "Tipos de inventario" de `/configuracion`.
 * El admin crea un tipo con timestamp único, lo edita y lo desactiva (soft
 * delete). La lista pagina, así que cada paso busca por el timestamp.
 */
function seccion(page: Page) {
  // Cada catálogo es una tarjeta <section> con su título.
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /^Tipos de inventario$/i }) });
}

test.describe('Inventario: CRUD de tipos de elemento', () => {
  test('admin crea, edita y desactiva un tipo de elemento', async ({ page }) => {
    const ts = Date.now();
    const nombreOriginal = `Camara E2E ${ts}`;
    const nombreEditado = `Camara E2E editada ${ts}`;

    await loginAs(page, 'admin');
    await page.goto('/configuracion');
    await page.waitForURL('**/configuracion');
    const shell = seccion(page);
    await expect(shell).toBeVisible({ timeout: 10_000 });

    // ---- Crear ----
    await shell.getByRole('button', { name: /^Crear tipo$/i }).click();
    const createDialog = page.getByRole('dialog', { name: /Crear Nuevo Tipo de Elemento/i });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/Nombre del Tipo/i).fill(nombreOriginal);
    await createDialog.getByLabel(/Descripción/i).fill('Tipo creado por el test e2e');
    await createDialog.getByRole('button', { name: /^Crear$/i }).click();
    await expect(page.getByText(/Tipo de Elemento creado/i).first()).toBeVisible({ timeout: 10_000 });
    await shell.getByPlaceholder(/Buscar en tipos de inventario/i).fill(String(ts));
    await expect(shell.getByText(nombreOriginal, { exact: true })).toBeVisible();

    // ---- Editar ----
    await shell.getByRole('button', { name: `Editar ${nombreOriginal}` }).click();
    const editDialog = page.getByRole('dialog', { name: /Editar Tipo de Elemento/i });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(/Nombre del Tipo/i).fill(nombreEditado);
    await editDialog.getByRole('button', { name: /^Actualizar$/i }).click();
    await expect(page.getByText(/Tipo de Elemento actualizado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(shell.getByText(nombreEditado, { exact: true })).toBeVisible();

    // ---- Desactivar (soft delete) ----
    await shell.getByRole('button', { name: `Eliminar ${nombreEditado}` }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^Eliminar$/i }).click();
    // Los tipos inactivos no se listan, así que la fila desaparece.
    await expect(shell.getByText(nombreEditado, { exact: true })).toHaveCount(0, { timeout: 10_000 });
  });
});

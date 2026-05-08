import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Flujo completo de solicitud de inventario gestionada por el admin:
 *
 *  1. La solicitud PENDIENTE se siembra en `E2EDataSeeder` asociada a la
 *     reserva APROBADA "Clase abierta E2E" para mantener el test
 *     independiente del form de creación de reserva (que tiene su propio
 *     spec de creación).
 *  2. El admin entra a /inventory/requests, abre el dialog "Gestionar".
 *  3. Asigna un item de inventario disponible al pedido.
 *  4. Aprueba la solicitud.
 *  5. Marca la solicitud como entregada.
 *
 * El test asume que solo existe una solicitud PENDIENTE en la base
 * (la sembrada), por lo que la fila correspondiente se localiza por su
 * estado "Pendiente".
 */
test.describe('Inventario: gestión de solicitudes', () => {
  test('admin asigna ítem, aprueba y marca como entregada la solicitud sembrada', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/inventory/requests');
    await page.waitForURL('**/inventory/requests');

    // Localizamos la fila pendiente y abrimos su dialog de gestión.
    const filaPendiente = page
      .locator('tr', { hasText: 'Pendiente' })
      .filter({ hasText: 'Proyector E2E' })
      .first();
    await expect(filaPendiente).toBeVisible({ timeout: 15_000 });
    await filaPendiente.getByRole('button', { name: /Gestionar/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Asignar item de inventario disponible: el Combobox del dialog se abre
    // y elegimos la primera opción real (descartando "Sin asignar").
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option').filter({ hasText: /Item|Proyector|#/i }).first().click();
    await dialog.getByRole('button', { name: /^Asignar$/i }).click();
    await expect(page.getByText(/Item de inventario asignado/i)).toBeVisible({ timeout: 10_000 });

    // Aprobar.
    await dialog.getByRole('button', { name: /^Aprobar$/i }).click();
    await expect(page.getByText(/Solicitud aprobada/i)).toBeVisible({ timeout: 10_000 });

    // Cerrar el dialog para acceder al botón "Entregado" que vive en la fila.
    await dialog.getByRole('button', { name: /^Cerrar$/i }).click();
    await expect(dialog).not.toBeVisible();

    // El botón "Entregado" aparece en la fila ya aprobada.
    const filaAprobada = page
      .locator('tr', { hasText: 'Aprobado' })
      .filter({ hasText: 'Proyector E2E' })
      .first();
    await expect(filaAprobada).toBeVisible({ timeout: 10_000 });
    await filaAprobada.getByRole('button', { name: /entregad/i }).click();
    await expect(page.getByText(/Entrega confirmada/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

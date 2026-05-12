import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cada fila de la tabla de auditoría tiene un botón con ícono ojo que
 * abre `AuditLogDetailsDialog` con la información completa del registro
 * (entidad, acción, usuario, timestamp, IP, método HTTP, endpoint y
 * payloads de datos previos/nuevos). Validamos que el diálogo se abra y
 * muestre los campos clave.
 */
test.describe('Auditoría: diálogo de detalles', () => {
  test('admin abre el detalle del primer registro y ve el modal', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/audit');
    await page.waitForURL('**/audit');

    const filaUno = page.locator('tbody tr').first();
    await expect(filaUno).toBeVisible({ timeout: 15_000 });
    await filaUno.locator('button:has(svg.lucide-eye)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    // El diálogo muestra labels fijos: Entidad, ID Entidad, Usuario, Fecha/Hora.
    await expect(dialog.getByText(/Entidad/i).first()).toBeVisible();
    await expect(dialog.getByText(/Usuario/i).first()).toBeVisible();
  });
});

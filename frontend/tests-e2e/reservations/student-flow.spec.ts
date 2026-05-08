import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Cancelación de reserva por el dueño.
 *
 * Usa la reserva APROBADA sembrada por E2EDataSeeder ("Clase abierta E2E"
 * en Sala 202, mañana). Solo las reservas APROBADAS y futuras muestran el
 * botón de cancelar; las PENDIENTES no, ya que la cancelación se hace por
 * vía de aprobación / rechazo del analista.
 *
 * Se ejerce con DOCENTE porque el rol ESTUDIANTE no tiene `/reservations`
 * habilitado en `frontend/src/lib/config/constants.ts`.
 */
test.describe('Reservas: dueño cancela una aprobada', () => {
  test('docente cancela su reserva APROBADO desde el listado', async ({ page }) => {
    await loginAs(page, 'docente');

    await page.goto('/reservations');
    await page.waitForURL('**/reservations');

    // La vista por defecto es calendario; cambiamos a tarjetas para ver el título.
    // ViewModeToggle muestra los iconos cards/table/calendar en ese orden.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-layout-grid') }).first().click();

    // El listado muestra la reserva APROBADA sembrada.
    const titulo = 'Clase abierta E2E';
    await expect(page.getByText(titulo).first()).toBeVisible({ timeout: 10_000 });

    // Solo las reservas APROBADAS y futuras renderizan el botón con icono X
    // (tooltip "Cancelar reserva"). Como solo hay una APROBADA en la lista,
    // el único botón con `svg.lucide-x` corresponde a "Clase abierta E2E".
    const cancelBtn = page.locator('button:has(svg.lucide-x)').first();
    await cancelBtn.click();

    // Diálogo de confirmación.
    const confirm = page.getByRole('button', { name: /Sí, cancelar reserva/i });
    await expect(confirm).toBeVisible();
    await confirm.click();

    // Toast o cambio de estado.
    await expect(page.getByText(/cancelada exitosamente|reserva cancelada/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

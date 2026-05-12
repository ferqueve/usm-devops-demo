import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `PriorityReservationsWidget` se monta en el dashboard de usuarios con
 * permiso `reserva:aprobar`. Carga `/recomendaciones/analistas/prioritarias`
 * y muestra una fila por cada reserva con `razon` + `espacioNombre` (no
 * el título). El seeder asigna "Charla docente E2E" en Sala 101 al rol
 * ANALISTA, así que la sala aparece como subrayado de la fila.
 */
test.describe('Recomendaciones: widget de reservas prioritarias', () => {
  test('analista ve el widget con al menos una fila apuntando a Sala 101', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.waitForURL('**/dashboard');

    const widget = page.locator('div', { has: page.getByText(/Reservas Prioritarias/i) }).first();
    await expect(widget).toBeVisible({ timeout: 15_000 });
    await expect(widget.getByText(/Sala 101/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

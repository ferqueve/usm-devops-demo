import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Round-trip del campo "Motivo de la solicitud". El docente lo completa al
 * crear una reserva y luego, al abrir el diálogo de detalles de su misma
 * reserva, el motivo debe aparecer renderizado. `ReservationDetailsDialog`
 * limita la visibilidad de este campo a los roles sin
 * `reserva:aprobar` (línea 68), por lo que el docente lo ve para revisar
 * lo que envió.
 */
test.describe('Reservas: motivo de solicitud round-trip', () => {
  test('docente crea con motivo, abre el detalle y el motivo está visible', async ({ page }) => {
    const motivo = `Clase de cierre del módulo - test ${Date.now()}`;

    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    const titulo = `Motivo E2E ${Date.now()}`;
    await page.getByLabel(/Título \*/i).fill(titulo);

    await page.getByLabel(/^Motivo$/i).fill(motivo);

    await page.getByLabel(/^Carrera$/i).click();
    await page.getByRole('option', { name: /Ingeniería en Sistemas/i }).click();

    await page.getByLabel(/Analista \*/i).click();
    await page.getByRole('option', { name: /analista e2e/i }).click();

    // Fecha: 8 días desde hoy (lejos de fechas seedeadas).
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 8);
    const dia = String(futuro.getDate());
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${dia}$`) })
      .first()
      .click();

    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('15');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('16');
    await horas.nth(3).fill('00');

    await page.getByRole('button', { name: /Enviar Solicitud/i }).click();
    await page.waitForURL('**/reservations');

    // Cambiamos a vista tabla para localizar la reserva recién creada.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    const fila = page.locator('tr', { hasText: titulo }).first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button:has(svg.lucide-eye)').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(motivo)).toBeVisible();
  });
});

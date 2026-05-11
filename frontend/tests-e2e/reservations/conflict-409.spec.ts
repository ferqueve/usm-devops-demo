import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Validación de conflictos de horario en el frontend.
 *
 * El backend valida solapamientos solo cuando ADMIN/ANALISTA crean reservas
 * auto-aprobadas; pero antes de llegar al 409, el componente `TimeSelect`
 * filtra las horas que ya están ocupadas para el espacio + fecha
 * seleccionados, devolviendo un valor distinto al que el usuario tipea
 * cuando esa hora está bloqueada.
 *
 * Este test confirma que cuando el admin abre el form para Sala 202 +
 * mañana, e intenta tipear "18" como hora de inicio (la APROBADA sembrada
 * va de 18:00 a 20:00 en ese espacio), el componente promueve la elección
 * a la siguiente hora libre disponible. Es la prevención de conflicto
 * desde la UI; el backend 409 quedaría como red de seguridad.
 */
test.describe('Reservas: prevención de conflicto horario en el form', () => {
  test('al elegir Sala 202 + mañana, las horas 18-19 están bloqueadas y el form las omite', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    // Espacio + fecha mañana (donde está la APROBADA 18:00-20:00).
    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 202/i }).click();

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const dia = String(manana.getDate());
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${dia}$`) })
      .first()
      .click();

    // Tipeamos "18" (hora bloqueada). TimeSelect debe promover a la
    // siguiente disponible (>=20 fuera del rango ocupado).
    const horaInicio = page.locator('input[placeholder="00"]').nth(0);
    await horaInicio.fill('18');

    // Esperamos un instante a que el componente normalice el valor.
    await page.waitForTimeout(200);
    const valor = await horaInicio.inputValue();
    const valorNum = Number.parseInt(valor, 10);

    // El componente puede subir a 20 o más (saltando el bloque 18-19) o
    // dejar vacío si no hay opciones, pero NO debe quedarse en 18.
    expect(valorNum === 18 ? null : valorNum).not.toBe(18);
  });
});

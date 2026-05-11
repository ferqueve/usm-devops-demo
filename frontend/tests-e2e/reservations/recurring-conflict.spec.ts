import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Recurrencia con conflicto parcial. El backend
 * (`ReservaService.esFechaRecurrenteValida`, líneas 410-424) salta las
 * instancias que solapan con una reserva APROBADO existente cuando quien
 * crea no es DOCENTE. El admin arma una serie diaria sobre Sala 101 a las
 * 14:00 con fecha inicio +4 días y fecha fin de recurrencia +6 días, lo
 * que genera tres fechas (+4, +5 y +6). La instancia +5 choca con
 * "Bloqueo recurrencia E2E" seedeada (Sala 101 a +5 días 14:00-15:00) y
 * se omite; quedan dos almacenadas.
 */
test.describe('Reservas: recurrencia con conflicto parcial', () => {
  test('admin crea serie diaria que pisa una APROBADA y queda una instancia menos', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    const titulo = `Recurrencia conflicto E2E ${Date.now()}`;
    await page.getByLabel(/Título \*/i).fill(titulo);

    // Fecha inicio: +4 días (sin reserva existente).
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 4);
    const diaInicio = String(inicio.getDate());
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${diaInicio}$`) })
      .first()
      .click();

    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('14');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('15');
    await horas.nth(3).fill('00');

    // Recurrencia diaria.
    const recurrenciaTrigger = page.locator('button:has(span:has-text("Sin recurrencia"))').first();
    await recurrenciaTrigger.scrollIntoViewIfNeeded();
    await recurrenciaTrigger.click();
    await page.getByRole('option', { name: /Diaria/i }).click();

    // Fecha fin recurrencia: +6 días (3 instancias generadas: +4, +5, +6).
    const finRec = new Date();
    finRec.setDate(finRec.getDate() + 6);
    const diaFinRec = String(finRec.getDate());
    await page.locator('button:has(svg.lucide-calendar)').nth(1).click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${diaFinRec}$`) })
      .first()
      .click();

    await page.getByRole('button', { name: /Crear Reserva/i }).click();
    await page.waitForURL('**/reservations');

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    const filas = page.locator('tr', { hasText: titulo });
    await expect(filas.first()).toBeVisible({ timeout: 10_000 });
    // El backend genera 3 instancias (+4, +5, +6) y omite la que choca
    // con la APROBADA sembrada en +5, dejando 2 almacenadas.
    expect(await filas.count()).toBe(2);
  });
});

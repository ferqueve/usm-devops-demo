import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Reserva recurrente: docente crea una reserva semanal con fecha fin a 3
 * semanas, y verifica que en el listado aparezcan varias instancias del
 * mismo título.
 */
test.describe('Reservas: creación recurrente', () => {
  test('docente crea una reserva semanal y se generan múltiples instancias', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    // Espacio + título + carrera + analista.
    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    const titulo = `Recurrente E2E ${Date.now()}`;
    await page.getByLabel(/Título \*/i).fill(titulo);

    await page.getByLabel(/^Carrera$/i).click();
    await page.getByRole('option', { name: /Ingeniería en Sistemas/i }).click();

    await page.getByLabel(/Analista \*/i).click();
    await page.getByRole('option', { name: /analista e2e/i }).click();

    // Fecha inicio: en 4 días (no choca con seeded de mañana).
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 4);
    const diaInicio = String(inicio.getDate());
    // Datepicker de fecha inicio: primer botón con el icono calendar.
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${diaInicio}$`) })
      .first()
      .click();

    // Horas: 08:00–09:00 (libres).
    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('08');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('09');
    await horas.nth(3).fill('00');

    // Recurrencia semanal: el SelectTrigger arranca con el valor por
    // defecto "Sin recurrencia (una sola vez)" (la <Label> no tiene htmlFor
    // así que getByLabel no aplica).
    const recurrenciaTrigger = page.locator('button:has(span:has-text("Sin recurrencia"))').first();
    await recurrenciaTrigger.scrollIntoViewIfNeeded();
    await recurrenciaTrigger.click();
    await page.getByRole('option', { name: /Semanal/i }).click();

    // Fecha fin de recurrencia: 1 semana después (genera 2 instancias).
    // Mantenemos ambas fechas dentro del mismo mes para que el calendario
    // visible no tenga que navegar entre meses.
    const finRec = new Date(inicio);
    finRec.setDate(finRec.getDate() + 7);
    const diaFin = String(finRec.getDate());
    // El segundo datepicker de la página es el de fecha fin.
    await page.locator('button:has(svg.lucide-calendar)').nth(1).click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${diaFin}$`) })
      .first()
      .click();

    // Submit.
    await page.getByRole('button', { name: /Enviar Solicitud/i }).click();
    await page.waitForURL('**/reservations');

    // Vista de tabla para localizar las múltiples filas.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-table') }).first().click();

    // Con recurrencia semanal y fin a 7 días, esperamos 2 instancias.
    const filas = page.locator('tr', { hasText: titulo });
    await expect(filas.first()).toBeVisible({ timeout: 10_000 });
    expect(await filas.count()).toBeGreaterThanOrEqual(2);
  });
});

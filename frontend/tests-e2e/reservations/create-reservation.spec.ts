import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';
import { elegirDia } from '../fixtures/datepicker';

/**
 * Creación completa de reserva por un docente: form con espacio, título,
 * carrera, analista, fecha, horas y submit. Tras éxito, redirige a
 * /reservations donde la reserva creada aparece en la lista.
 *
 * Es el flujo más representativo del producto y el que más componentes UI
 * encadena (5 Radix Selects + DatePicker + 4 inputs de hora). El test usa
 * Sala 101 con un horario distinto a las pendientes/aprobadas sembradas
 * para evitar conflictos.
 */
test.describe('Reservas: docente crea una reserva desde el form', () => {
  test('docente completa el form y la reserva aparece en su listado', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');
    await expect(page.getByRole('heading', { name: /Nueva Solicitud de Reserva/i })).toBeVisible();

    // Espacio
    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    // Título único para localizar la reserva creada después.
    const titulo = `Test E2E ${Date.now()}`;
    await page.getByLabel(/Título \*/i).fill(titulo);

    // Carrera
    await page.getByLabel(/^Carrera$/i).click();
    await page.getByRole('option', { name: /Ingeniería en Sistemas/i }).click();

    // Analista (obligatorio para DOCENTE).
    await page.getByLabel(/Analista \*/i).click();
    await page.getByRole('option', { name: /analista e2e/i }).click();

    // Fecha: 3 días desde hoy (las reservas sembradas son mañana). Evita
    // conflicto con la pendiente seedeada en Sala 101 a la misma hora.
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 3);
    // El form inicializa fecha=hoy, así que el botón ya no dice
    // "Seleccionar fecha". Lo localizamos por el icono calendario.
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await elegirDia(page, futuro);

    // Horas: 4 inputs con placeholder "00" (hora inicio, min inicio, hora fin, min fin).
    const horaInputs = page.locator('input[placeholder="00"]');
    await horaInputs.nth(0).fill('14');
    await horaInputs.nth(1).fill('00');
    await horaInputs.nth(2).fill('15');
    await horaInputs.nth(3).fill('00');

    // Submit.
    await page.getByRole('button', { name: /Enviar Solicitud/i }).click();
    await page.waitForURL('**/reservations');

    // La nueva reserva aparece en la vista (cambiamos a tarjetas para ver el título).
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-layout-grid') }).first().click();
    await expect(page.getByText(titulo).first()).toBeVisible({ timeout: 10_000 });
  });
});

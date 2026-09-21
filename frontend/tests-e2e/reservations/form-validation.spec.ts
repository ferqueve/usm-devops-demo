import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';
import { elegirDia } from '../fixtures/datepicker';

/**
 * El botón de submit del formulario se mantiene deshabilitado mientras
 * falten campos obligatorios. Verificamos el caso donde el docente abre el
 * form y, sin completar título/horas, el botón "Enviar Solicitud" está
 * disabled; luego de completar los campos, queda habilitado.
 */
test.describe('Reservas: validación del formulario (campos obligatorios)', () => {
  test('Enviar Solicitud arranca disabled y se habilita al completar campos', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    const submit = page.getByRole('button', { name: /Enviar Solicitud/i });
    await expect(submit).toBeDisabled();

    // Completar todos los campos obligatorios.
    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();
    await page.getByLabel(/Título \*/i).fill(`Validación E2E ${Date.now()}`);
    await page.getByLabel(/^Carrera$/i).click();
    await page.getByRole('option', { name: /Ingeniería en Sistemas/i }).click();
    await page.getByLabel(/Analista \*/i).click();
    await page.getByRole('option', { name: /analista e2e/i }).click();

    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 7);
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await elegirDia(page, futuro);

    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('16');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('17');
    await horas.nth(3).fill('00');

    await expect(submit).toBeEnabled({ timeout: 5_000 });
  });
});

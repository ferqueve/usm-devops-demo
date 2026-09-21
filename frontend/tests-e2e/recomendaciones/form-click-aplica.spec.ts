import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';
import { elegirDia } from '../fixtures/datepicker';

/**
 * Las cards de recomendaciones del formulario son interactivas: al
 * clickearlas escriben en el form principal (`onSelectEspacio` setea
 * `formData.espacioId`). Validamos esa conexión end-to-end llenando
 * fecha y horas para disparar "Espacios Recomendados", clickeando la
 * primera sugerencia y comprobando que el select "Espacio *" ya
 * muestra esa sala como seleccionada.
 */
test.describe('Recomendaciones: click en una sugerencia actualiza el form', () => {
  test('docente clickea un espacio recomendado y queda preseleccionado en el select', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    // Fecha (+7 días) + horas libres → dispara Espacios Recomendados.
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await elegirDia(page, fecha);

    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('09');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('10');
    await horas.nth(3).fill('00');

    // Antes del click: el select de Espacio muestra el placeholder, no una
    // sala concreta.
    const espacioTrigger = page.locator('button#espacio');
    await expect(espacioTrigger).toContainText(/Seleccionar espacio/i, { timeout: 15_000 });

    // Esperar a que carguen las recomendaciones y clickear la primera card.
    await expect(page.getByText(/Espacios Recomendados/i).first()).toBeVisible({ timeout: 15_000 });
    const primerH4 = page.locator('h4', { hasText: /Sala|Lab/ }).first();
    await expect(primerH4).toBeVisible();
    await primerH4.click();

    // Tras el click el select queda preseleccionado con alguna de las salas.
    await expect(espacioTrigger).toContainText(/Sala 10[12]|Sala 20[12]|Lab 303/, { timeout: 5_000 });
  });
});

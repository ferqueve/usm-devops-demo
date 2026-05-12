import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El sidebar del form de creación de reserva consulta
 * `/recomendaciones/reservas/espacios` cuando el docente llena fecha +
 * horas. La sección "Espacios Recomendados" aparece como bloque con un
 * encabezado distintivo y al menos una card de espacio sembrado.
 */
test.describe('Recomendaciones: espacios sugeridos en el form de reserva', () => {
  test('docente carga fecha y horas, y aparecen espacios recomendados', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    // Fecha: +6 días.
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 6);
    const dia = String(fecha.getDate());
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await page
      .locator('[role="dialog"] [role="gridcell"] button')
      .filter({ hasText: new RegExp(`^${dia}$`) })
      .first()
      .click();

    // Horas: 10:00-11:00 (libres).
    const horas = page.locator('input[placeholder="00"]');
    await horas.nth(0).fill('10');
    await horas.nth(1).fill('00');
    await horas.nth(2).fill('11');
    await horas.nth(3).fill('00');

    // El bloque "Espacios Recomendados" se renderiza en el sidebar tras la
    // respuesta del backend.
    await expect(page.getByText(/Espacios Recomendados/i).first())
      .toBeVisible({ timeout: 15_000 });
    // Una de las salas seedeadas (Sala 101 o Sala 202) debe aparecer como card.
    await expect(page.getByText(/^Sala 10[12]$|^Sala 20[12]$/).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

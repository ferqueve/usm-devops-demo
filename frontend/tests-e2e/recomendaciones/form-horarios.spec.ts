import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';
import { elegirDia } from '../fixtures/datepicker';

/**
 * Cuando el docente selecciona un espacio en `/reservations/create`, el
 * sidebar carga `/recomendaciones/reservas/horarios` para esa sala y la
 * fecha elegida. El bloque "Horarios Recomendados" debe aparecer con al
 * menos un botón de slot.
 */
test.describe('Recomendaciones: horarios sugeridos para un espacio', () => {
  test('docente elige Sala 101 + fecha y aparece el panel de horarios', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 101/i }).click();

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 6);
    await page.locator('button:has(svg.lucide-calendar)').first().click();
    await elegirDia(page, fecha);

    await expect(page.getByText(/Horarios Recomendados/i).first())
      .toBeVisible({ timeout: 15_000 });
  });
});

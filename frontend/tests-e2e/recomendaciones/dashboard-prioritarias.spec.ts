import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El dashboard del analista arma "La cola de hoy" con las pendientes y las
 * prioritarias de `/recomendaciones/analistas/prioritarias`. El seeder asigna
 * "Charla docente E2E" en Sala 101 al rol ANALISTA, así que el encabezado
 * nombra a Sala 101 con al menos una urgente y el panel "Cola" la lista.
 */
test.describe('Recomendaciones: widget de reservas prioritarias', () => {
  test('analista ve la cola con al menos una urgente apuntando a Sala 101', async ({ page }) => {
    await loginAs(page, 'analista');
    await page.waitForURL('**/dashboard');

    await expect(page.getByText(/Sala 101 concentra \d+ · [1-9]\d* urgentes/i))
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /^Cola$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Charla docente E2E.*Sala 101/i }).first())
      .toBeVisible({ timeout: 10_000 });
  });
});

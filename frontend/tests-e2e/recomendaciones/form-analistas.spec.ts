import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * `AnalistaRecomendado` se monta debajo del `AnalistaSelect` en
 * `ReservationForm` y `ReservationFormDialog` cuando el rol requiere
 * asignación de analista (docente/externo). Llama a
 * `/recomendaciones/analistas/asignacion?docenteId=...` y muestra tres
 * sugerencias con puntaje. Cualquier card al clickearse debe setear el
 * select con ese analista. El test cubre la versión página completa de
 * `/reservations/create`.
 */
test.describe('Recomendaciones: analistas sugeridos en el form', () => {
  test('docente ve "Analistas Recomendados" debajo del select', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    const panel = page.locator('div', { has: page.getByText(/Analistas Recomendados/i) }).first();
    await expect(panel).toBeVisible({ timeout: 15_000 });
    // Dentro del panel, cada card es un botón con el email del analista.
    await expect(panel.getByRole('button').first()).toBeVisible({ timeout: 5_000 });
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Al seleccionar un espacio en el form, también se consulta
 * `/recomendaciones/items/para-reserva` y se renderiza el bloque "Items
 * Recomendados". `RecomendacionItemService` filtra ítems con
 * `estado='DISPONIBLE'`. Sala 202 queda con al menos un Proyector
 * DISPONIBLE tras las mutaciones de los tests de inventario (que corren
 * antes alfabéticamente), por lo que apuntamos a esa sala para tener un
 * seed determinista que dispare la sugerencia.
 */
test.describe('Recomendaciones: ítems sugeridos para un espacio', () => {
  test('docente elige Sala 202 y aparece el panel de ítems recomendados', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/reservations/create');
    await page.waitForURL('**/reservations/create');

    await page.getByLabel(/Espacio \*/i).click();
    await page.getByRole('option', { name: /Sala 202/i }).click();

    await expect(page.getByText(/Items Recomendados/i).first())
      .toBeVisible({ timeout: 15_000 });
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol MANTENIMIENTO tiene CRUD completo sobre espacios y debe ver los
 * botones de gestión en `/rooms`. Verificamos "Agregar Espacio" y
 * "Tipos de Espacios", junto con la fila de Sala 101 cargada en la lista.
 */
test.describe('Espacios: rol MANTENIMIENTO gestiona espacios', () => {
  test('mantenimiento ve los botones de gestión en /rooms', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Agregar Espacio/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Tipos de Espacios/i }).first()).toBeVisible();
  });
});

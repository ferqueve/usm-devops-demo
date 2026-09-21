import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El rol MANTENIMIENTO tiene CRUD completo sobre espacios y debe ver los
 * botones de gestión: "Agregar Espacio" en `/rooms` (con la fila de Sala 101
 * cargada) y la edición de tipos de espacio en `/configuracion`.
 */
test.describe('Espacios: rol MANTENIMIENTO gestiona espacios', () => {
  test('mantenimiento ve los botones de gestión en /rooms', async ({ page }) => {
    await loginAs(page, 'mantenimiento');
    await page.goto('/rooms');
    await page.waitForURL('**/rooms');

    await expect(page.getByText('Sala 101', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Agregar Espacio/i }).first()).toBeVisible();

    // Los tipos de espacio se gestionan desde Configuración.
    await page.goto('/configuracion');
    await expect(page.getByRole('heading', { name: /^Tipos de espacios$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Editar Sala E2E' })).toBeVisible();
  });
});

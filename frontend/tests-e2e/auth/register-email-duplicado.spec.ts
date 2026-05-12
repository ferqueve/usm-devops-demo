import { test, expect } from '@playwright/test';

/**
 * Al intentar registrarse con un email ya existente en la base
 * (`admin@e2e.test`, seedeado), el backend responde con error y la UI
 * mantiene el form sin mostrar la pantalla de éxito.
 */
test.describe('Auth: registro con email duplicado', () => {
  test('registrar con admin@e2e.test falla y el form sigue visible', async ({ page }) => {
    await page.goto('/auth/register');

    await page.getByLabel(/^Nombre$/i).fill('Duplicado');
    await page.getByLabel(/^Apellido$/i).fill('E2E');
    await page.getByLabel(/Correo Electrónico/i).fill('admin@e2e.test');
    await page.getByLabel(/^Contraseña$/i).fill('Test1234!');
    await page.getByLabel(/Confirmar Contraseña/i).fill('Test1234!');

    await page.locator('#aceptaTerminos').click();
    await page.locator('#aceptaPolitica').click();

    await page.getByRole('button', { name: /^Crear Cuenta$/i }).click();

    // El mensaje de éxito no debe aparecer; el form sigue presente.
    await page.waitForTimeout(2_000);
    expect(await page.getByRole('heading', { name: /¡Registro Exitoso!/i }).count()).toBe(0);
    await expect(page.getByRole('heading', { name: /^Crear Cuenta$/i })).toBeVisible();
  });
});

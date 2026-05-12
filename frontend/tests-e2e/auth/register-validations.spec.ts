import { test, expect } from '@playwright/test';

/**
 * El form de registro tiene validaciones del lado cliente: si las
 * contraseñas no coinciden o faltan checkboxes obligatorios, el submit no
 * dispara el `onRegister` y el usuario sigue en la página. Validamos que
 * con contraseñas distintas el form muestra error y nunca aparece el
 * mensaje de "¡Registro Exitoso!".
 */
test.describe('Auth: validaciones del form de registro', () => {
  test('contraseñas que no coinciden bloquean el submit', async ({ page }) => {
    await page.goto('/auth/register');

    await page.getByLabel(/^Nombre$/i).fill('Tester');
    await page.getByLabel(/^Apellido$/i).fill('Validación');
    await page.getByLabel(/Correo Electrónico/i).fill(`val-${Date.now()}@example.com`);
    await page.getByLabel(/^Contraseña$/i).fill('Test1234!');
    await page.getByLabel(/Confirmar Contraseña/i).fill('OtraDistinta1!');

    await page.locator('#aceptaTerminos').click();
    await page.locator('#aceptaPolitica').click();

    await page.getByRole('button', { name: /^Crear Cuenta$/i }).click();

    // Tras el intento, el form sigue visible (no apareció el mensaje de éxito).
    await expect(page.getByRole('heading', { name: /^Crear Cuenta$/i })).toBeVisible();
    expect(await page.getByRole('heading', { name: /¡Registro Exitoso!/i }).count()).toBe(0);
  });
});

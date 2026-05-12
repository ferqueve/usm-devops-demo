import { test, expect } from '@playwright/test';

/**
 * Registro de un usuario nuevo en `/auth/register`. El formulario pide
 * nombre, apellido, email, contraseña, confirmación y aceptación de
 * términos + política. Tras el submit exitoso, la página reemplaza el form
 * por el componente `EmailVerificationMessage` que dice
 * "¡Registro Exitoso!" e indica que se envió un email de verificación.
 *
 * Usamos un email único con timestamp y dominio externo (`@example.com`)
 * para no chocar con los usuarios seedeados ni con las aserciones de
 * `filter-verificado`, que solo buscan `@e2e.test`.
 */
test.describe('Auth: registro de usuario nuevo', () => {
  test('un visitante completa el form y ve la confirmación de email', async ({ page }) => {
    const email = `register-e2e-${Date.now()}@example.com`;
    const password = 'Test1234!';

    await page.goto('/auth/register');

    await page.getByLabel(/^Nombre$/i).fill('Nuevo');
    await page.getByLabel(/^Apellido$/i).fill('Usuario E2E');
    await page.getByLabel(/Correo Electrónico/i).fill(email);
    await page.getByLabel(/^Contraseña$/i).fill(password);
    await page.getByLabel(/Confirmar Contraseña/i).fill(password);

    await page.locator('#aceptaTerminos').click();
    await page.locator('#aceptaPolitica').click();

    await page.getByRole('button', { name: /^Crear Cuenta$/i }).click();

    await expect(page.getByRole('heading', { name: /¡Registro Exitoso!/i }))
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/enlace de verificación a tu correo/i)).toBeVisible();
  });
});

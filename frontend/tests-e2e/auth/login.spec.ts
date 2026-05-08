import { test, expect } from '@playwright/test';
import { seedUsers } from '../fixtures/users';

test.describe('Login E2E', () => {
  test('admin inicia sesión y aterriza en el dashboard', async ({ page }) => {
    await page.goto('/auth');

    await page.getByLabel(/correo electrónico/i).fill(seedUsers.admin.email);
    await page.getByLabel(/contraseña/i).fill(seedUsers.admin.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();
  });

  test('login con credenciales inválidas muestra error y mantiene la pantalla', async ({ page }) => {
    await page.goto('/auth');

    await page.getByLabel(/correo electrónico/i).fill(seedUsers.admin.email);
    await page.getByLabel(/contraseña/i).fill('password-incorrecta');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Mensaje de error visible y permanecemos en /auth.
    await expect(page.getByText(/credenciales|inválid|incorrect/i).first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/auth');
  });
});

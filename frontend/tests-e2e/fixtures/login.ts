import type { Page } from '@playwright/test';
import { seedUsers, type SeedRole } from './users';

/**
 * Inicia sesión con el usuario sembrado del rol indicado y espera la redirección
 * a la primera ruta permitida. Cada rol cae en su landing por defecto:
 * `/dashboard` para todos los roles que tienen acceso a esa ruta.
 */
export async function loginAs(page: Page, role: SeedRole): Promise<void> {
  const user = seedUsers[role];
  await page.goto('/auth');
  await page.getByLabel(/correo electrónico/i).fill(user.email);
  await page.getByLabel(/contraseña/i).fill(user.password);
  await page.getByRole('button', { name: /^iniciar sesión$/i }).click();
  await page.waitForURL('**/dashboard');
}

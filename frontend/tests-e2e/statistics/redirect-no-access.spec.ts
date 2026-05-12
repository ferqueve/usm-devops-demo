import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Los roles DOCENTE, ESTUDIANTE y EXTERNO no tienen `/statistics` en su
 * lista de rutas permitidas (`ROLE_PERMISSIONS.*`). `RoleProtectedRoute`
 * los redirige fuera al intentar entrar. Verificamos el caso DOCENTE.
 */
test.describe('Estadísticas: control de acceso por rol', () => {
  test('docente es redirigido fuera de /statistics', async ({ page }) => {
    await loginAs(page, 'docente');
    await page.goto('/statistics');
    await page.waitForURL((url) => !url.pathname.startsWith('/statistics'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/statistics');
  });
});

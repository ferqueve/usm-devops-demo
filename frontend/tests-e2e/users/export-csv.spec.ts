import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * El botón "Exportar CSV" descarga un archivo `usuarios_<fecha>.csv` con
 * la lista filtrada actual. Validamos que el click dispare un download
 * con el nombre esperado.
 */
test.describe('Usuarios: exportar CSV', () => {
  test('admin clickea "Exportar CSV" y se dispara una descarga', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await page.waitForURL('**/users');

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await page.getByRole('button', { name: /Exportar CSV/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^usuarios_.*\.csv$/);
  });
});

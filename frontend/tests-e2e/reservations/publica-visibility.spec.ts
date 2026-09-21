import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/login';

/**
 * Visibilidad pública vs privada en /calendar. El componente `Calendar`
 * filtra explícitamente cuando el rol es EXTERNO: solo deja pasar reservas
 * con `esPublica === true` (línea 95 de `components/calendar/index.tsx`).
 * Para el resto de roles, se muestran todas las APROBADAS. Validamos el
 * caso EXTERNO: ve "Clase abierta E2E" (pública) pero no las históricas
 * privadas del docente como "Histórico 2 E2E".
 */
test.describe('Reservas: visibilidad pública vs privada en /calendar', () => {
  test('externo solo ve reservas con esPublica=true', async ({ page }) => {
    await loginAs(page, 'externo');
    await page.goto('/calendar');
    await page.waitForURL('**/calendar');

    // Esperamos a que cargue el grid horario.
    await expect(page.getByText(/^\d{2}:00$/).first()).toBeVisible({ timeout: 10_000 });

    // El aria-label de cada barra es `${espacioNombre} — hh:mm a. m. a hh:mm p. m.`.
    // La APROBADA pública sembrada es Sala 202 mañana 18:00-20:00.
    await expect(page.getByRole('button', { name: /Sala 202 — 06:00 p\. m\. a 08:00 p\. m\./ }).first())
      .toBeVisible({ timeout: 10_000 });

    // Las históricas privadas del docente (esPublica=false) están en
    // Sala 101 a las 09:00-10:00 — no deben aparecer para el externo.
    expect(await page.getByRole('button', { name: /Sala 101 — 09:00 a\. m\. a 10:00 a\. m\./ }).count()).toBe(0);
  });
});

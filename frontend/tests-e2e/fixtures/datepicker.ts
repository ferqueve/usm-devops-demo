import type { Page } from '@playwright/test';

/**
 * Elige `fecha` en el datepicker abierto (el último popover `role=dialog`).
 *
 * Busca el día por `data-day` (M/D/AAAA) y no por el número visible: con el
 * número, "2" agarraba el 2 del mes en curso aunque la fecha buscada fuera el
 * 2 del mes siguiente, y el test dependía del día en que se corría. Si la
 * fecha no está en la grilla visible, avanza de mes.
 */
export async function elegirDia(page: Page, fecha: Date): Promise<void> {
  const picker = page.getByRole('dialog').last();
  const dataDay = `${fecha.getMonth() + 1}/${fecha.getDate()}/${fecha.getFullYear()}`;
  for (let i = 0; i < 3; i++) {
    const dia = picker.locator(`button[data-day="${dataDay}"]:not([disabled])`);
    if ((await dia.count()) > 0) {
      await dia.first().click();
      return;
    }
    await picker.getByRole('button', { name: /Next Month/i }).click();
  }
  throw new Error(`No se encontró el día ${dataDay} en el datepicker`);
}

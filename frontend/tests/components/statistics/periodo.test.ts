import { describe, it, expect } from 'vitest';
import { hoyEnElCampus, rangoDe } from '@/components/statistics/periodo';

describe('período de estadísticas', () => {
  // A las 22:00 de Montevideo ya es el día siguiente en UTC: con toISOString
  // el período terminaba mañana.
  it('hoy es la fecha del campus, no la de UTC', () => {
    expect(hoyEnElCampus(new Date('2026-09-14T01:00:00Z'))).toBe('2026-09-13');
    expect(hoyEnElCampus(new Date('2026-09-14T03:00:00Z'))).toBe('2026-09-14');
  });

  it('los últimos 30 y 90 días incluyen hoy', () => {
    expect(rangoDe('30d', '2026-09-14')).toEqual({ desde: '2026-08-16', hasta: '2026-09-14' });
    expect(rangoDe('90d', '2026-09-14')).toEqual({ desde: '2026-06-17', hasta: '2026-09-14' });
  });

  it('los últimos 12 meses arrancan al día siguiente de hace un año', () => {
    expect(rangoDe('12m', '2026-09-14')).toEqual({ desde: '2025-09-15', hasta: '2026-09-14' });
  });

  it('este año arranca el 1 de enero', () => {
    expect(rangoDe('anio', '2026-09-14')).toEqual({ desde: '2026-01-01', hasta: '2026-09-14' });
  });
});

import { porcentaje } from '@/components/statistics/reservas/formato';

describe('porcentaje', () => {
  it('no redondea a 100% ni a 0% cuando no corresponde', () => {
    expect(porcentaje(2375, 2382)).toBe(99);
    expect(porcentaje(3, 8214)).toBe(1);
    expect(porcentaje(10, 10)).toBe(100);
    expect(porcentaje(0, 10)).toBe(0);
    expect(porcentaje(5, 0)).toBe(0);
    expect(porcentaje(1, 3)).toBe(33);
  });
});

import { describe, it, expect } from 'vitest';
import { marcarIncompletos } from '@/components/statistics/reservas/tramos';
import type { ResumenReservas } from '@/lib/api/stats';

const base = (over: Partial<ResumenReservas>): ResumenReservas => ({
  desde: '2026-06-17',
  hasta: '2026-09-14',
  actual: {} as ResumenReservas['actual'],
  anterior: {} as ResumenReservas['anterior'],
  espaciosTotal: 0,
  granularidad: 'semana',
  serie: [],
  diario: [],
  porRol: [],
  ...over,
}) as ResumenReservas;

const punto = (periodo: string) => ({ periodo, aprobadas: 1, pendientes: 0, canceladas: 0 });

describe('marcarIncompletos', () => {
  it('marca la primera y la última semana cuando el período las corta', () => {
    // 17/6/2026 es miércoles; 14/9/2026 es lunes.
    const r = marcarIncompletos(base({ serie: [punto('2026-06-15'), punto('2026-06-22'), punto('2026-09-14')] }));
    expect(r.map((p) => p.incompleto)).toEqual([true, false, true]);
    expect(r[0]).toMatchObject({ desde: '2026-06-17', hasta: '2026-06-21' });
    expect(r[2]).toMatchObject({ desde: '2026-09-14', hasta: '2026-09-14' });
  });

  it('un mes que cae entero adentro no se marca', () => {
    const r = marcarIncompletos(base({
      granularidad: 'mes',
      desde: '2025-09-15',
      hasta: '2026-09-14',
      serie: [punto('2025-09-01'), punto('2026-02-01'), punto('2026-09-01')],
    }));
    expect(r.map((p) => p.incompleto)).toEqual([true, false, true]);
    expect(r[1].hasta).toBe('2026-02-28');
  });

  it('por día nunca hay incompletos', () => {
    const r = marcarIncompletos(base({ granularidad: 'dia', desde: '2026-09-01', hasta: '2026-09-02', serie: [punto('2026-09-01'), punto('2026-09-02')] }));
    expect(r.every((p) => !p.incompleto)).toBe(true);
  });
});

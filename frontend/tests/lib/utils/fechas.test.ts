import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fechaCorta,
  fechaHora,
  fechaHoraLarga,
  fechaLarga,
  relativa,
  soloFecha,
} from '@/lib/utils/fechas';

afterEach(() => vi.useRealTimers());

describe('fechas', () => {
  it('sin fecha devuelve el guion, y el vacío que le pidan', () => {
    for (const f of [fechaHora, fechaCorta, fechaLarga, soloFecha, fechaHoraLarga]) {
      expect(f(null)).toBe('—');
      expect(f(undefined)).toBe('—');
      expect(f('')).toBe('—');
    }
    expect(fechaHora(null, { vacio: '' })).toBe('');
    expect(fechaCorta(null, 'n/d')).toBe('n/d');
  });

  it('una fecha que no se entiende no revienta', () => {
    expect(fechaHora('mañana a la tarde')).toBe('—');
    expect(fechaCorta('2026-13-45')).toBe('—');
  });

  // Un «YYYY-MM-DD» es un día, no un instante. Leerlo en hora local lo corre
  // un día para atrás al oeste de Greenwich, que es donde está Uruguay.
  it('un día sin hora no se corre de día', () => {
    expect(fechaCorta('2026-09-18')).toBe('18 set');
    expect(fechaLarga('2026-09-18')).toContain('18');
    expect(fechaLarga('2026-09-18')).toContain('setiembre');
  });

  it('el día de la semana sale sólo si se pide', () => {
    const con = fechaHora('2026-09-18T14:30:00', { diaSemana: true });
    const sin = fechaHora('2026-09-18T14:30:00');
    expect(con.length).toBeGreaterThan(sin.length);
    expect(sin).toContain('2026');
  });

  it('el formato largo no lleva año', () => {
    expect(fechaHoraLarga('2026-09-18T14:30:00')).not.toContain('2026');
  });

  describe('relativa', () => {
    it('mira días de calendario, no 24 horas exactas', () => {
      // 23:00 y faltan menos de 24 h para mañana a las 22:00, y aun así son
      // días distintos: «Hoy» y «Mañana».
      vi.useFakeTimers().setSystemTime(new Date(2026, 8, 18, 23, 0));
      expect(relativa(new Date(2026, 8, 18, 23, 30).toISOString())).toBe('Hoy');
      expect(relativa(new Date(2026, 8, 19, 22, 0).toISOString())).toBe('Mañana');
      expect(relativa(new Date(2026, 8, 17, 1, 0).toISOString())).toBe('Ayer');
    });

    it('más lejos, cuenta los días', () => {
      vi.useFakeTimers().setSystemTime(new Date(2026, 8, 18, 12, 0));
      expect(relativa(new Date(2026, 8, 21, 9, 0).toISOString())).toBe('en 3 días');
      expect(relativa(new Date(2026, 8, 15, 9, 0).toISOString())).toBe('hace 3 días');
    });

    it('sin fecha no dice nada, no dice «—»', () => {
      expect(relativa(null)).toBe('');
    });
  });
});

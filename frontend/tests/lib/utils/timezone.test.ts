import { describe, it, expect } from 'vitest';
import {
  toUTC,
  fromUTC,
  formatInClientTimezone,
  createLocalDateTimeUTC,
  formatDateOnly,
  formatTimeOnly,
} from '@/lib/utils/timezone';

describe('timezone utilities', () => {
  describe('toUTC', () => {
    it('convierte una Date válida a ISO UTC string', () => {
      const date = new Date('2025-01-15T17:00:00Z');
      expect(toUTC(date)).toBe('2025-01-15T17:00:00.000Z');
    });

    it('lanza error con fecha inválida (NaN)', () => {
      expect(() => toUTC(new Date('invalid'))).toThrow('Fecha inválida');
    });

    it('lanza error con valor que no es Date', () => {
      // @ts-expect-error testing invalid input on purpose
      expect(() => toUTC(null)).toThrow('Fecha inválida');
    });
  });

  describe('fromUTC', () => {
    it('parsea string UTC ISO a Date válido', () => {
      const date = fromUTC('2025-01-15T17:00:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(Number.isNaN(date.getTime())).toBe(false);
    });

    it('lanza error si el string es vacío', () => {
      expect(() => fromUTC('')).toThrow('String de fecha UTC requerido');
    });

    it('lanza TypeError si el string no es parseable', () => {
      expect(() => fromUTC('not-a-date')).toThrow(TypeError);
    });
  });

  describe('formatInClientTimezone', () => {
    it('devuelve string formateado para fechas válidas', () => {
      const result = formatInClientTimezone('2025-01-15T17:00:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('Fecha inválida');
    });

    it('devuelve "Fecha inválida" en errores', () => {
      expect(formatInClientTimezone('')).toBe('Fecha inválida');
    });
  });

  describe('createLocalDateTimeUTC', () => {
    it('crea string ISO con hora ajustada', () => {
      const date = new Date(2025, 0, 15);
      const result = createLocalDateTimeUTC(date, 14, 30);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('lanza error si la fecha es inválida', () => {
      expect(() => createLocalDateTimeUTC(new Date('x'), 10, 0)).toThrow('Fecha inválida');
    });

    it('lanza error si la hora está fuera de rango', () => {
      expect(() => createLocalDateTimeUTC(new Date(), 25, 0)).toThrow('Hora o minuto inválido');
      expect(() => createLocalDateTimeUTC(new Date(), 10, 60)).toThrow('Hora o minuto inválido');
      expect(() => createLocalDateTimeUTC(new Date(), -1, 0)).toThrow('Hora o minuto inválido');
    });
  });

  describe('formatDateOnly', () => {
    it('formatea solo fecha', () => {
      const result = formatDateOnly('2025-01-15T17:00:00Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('devuelve "Fecha inválida" en error', () => {
      expect(formatDateOnly('')).toBe('Fecha inválida');
    });
  });

  describe('formatTimeOnly', () => {
    it('formatea solo hora', () => {
      const result = formatTimeOnly('2025-01-15T17:00:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('devuelve "Hora inválida" en error', () => {
      expect(formatTimeOnly('')).toBe('Hora inválida');
    });
  });
});

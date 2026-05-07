import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  formatDateForInput,
  getDateDaysAgo,
} from '@/lib/utils/date-helpers';

describe('formatDate', () => {
  it('formatea ISO válida', () => {
    const r = formatDate('2025-01-15T10:00:00Z');
    expect(r).not.toBe('Fecha inválida');
    expect(r.length).toBeGreaterThan(0);
  });

  it('devuelve "Fecha inválida" para input inválido', () => {
    expect(formatDate('not-a-date')).toBe('Fecha inválida');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve "Hace un momento" si fue hace <1 min', () => {
    expect(formatRelativeTime('2025-01-15T11:59:30Z')).toBe('Hace un momento');
  });

  it('devuelve minutos para diferencias <1h', () => {
    expect(formatRelativeTime('2025-01-15T11:55:00Z')).toBe('Hace 5 minutos');
  });

  it('singular minuto', () => {
    expect(formatRelativeTime('2025-01-15T11:59:00Z')).toBe('Hace 1 minuto');
  });

  it('horas', () => {
    expect(formatRelativeTime('2025-01-15T09:00:00Z')).toBe('Hace 3 horas');
  });

  it('días', () => {
    expect(formatRelativeTime('2025-01-13T12:00:00Z')).toBe('Hace 2 días');
  });

  it('para fechas más viejas usa formatDate', () => {
    const r = formatRelativeTime('2024-01-01T00:00:00Z');
    expect(r).not.toBe('Fecha inválida');
    expect(r).not.toMatch(/^Hace/);
  });

  it('"Fecha inválida" si no parsea', () => {
    expect(formatRelativeTime('xxx')).toBe('Fecha inválida');
  });
});

describe('formatDateForInput', () => {
  it('devuelve YYYY-MM-DD', () => {
    expect(formatDateForInput('2025-01-15T10:00:00Z')).toBe('2025-01-15');
  });

  it('devuelve "" si es inválido', () => {
    expect(formatDateForInput('xxx')).toBe('');
  });
});

describe('getDateDaysAgo', () => {
  it('devuelve fecha en formato YYYY-MM-DD', () => {
    expect(getDateDaysAgo(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('devuelve fechas distintas para distintos n', () => {
    expect(getDateDaysAgo(0)).not.toBe(getDateDaysAgo(7));
  });
});

import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatUptime,
  formatCurrency,
  generateColorFromString,
} from '@/lib/utils/formatters';

describe('formatBytes', () => {
  it('0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('GB con decimales', () => {
    const r = formatBytes(1024 * 1024 * 1024 * 2.5);
    expect(r).toContain('GB');
  });
});

describe('formatUptime', () => {
  it('segundos', () => {
    expect(formatUptime(5_000)).toBe('5s');
  });

  it('minutos', () => {
    expect(formatUptime(65_000)).toBe('1m 5s');
  });

  it('horas', () => {
    expect(formatUptime(3_600_000 + 60_000)).toBe('1h 1m');
  });

  it('días', () => {
    expect(formatUptime(86_400_000 + 3_600_000)).toBe('1d 1h');
  });
});

describe('formatCurrency', () => {
  it('formatea como número con símbolo', () => {
    const r = formatCurrency(1500);
    expect(r).toMatch(/1[\s.,]?500/);
  });
});

describe('generateColorFromString', () => {
  it('devuelve color hex válido', () => {
    expect(generateColorFromString('hola')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('mismo string -> mismo color', () => {
    expect(generateColorFromString('foo')).toBe(generateColorFromString('foo'));
  });

  it('usa default cuando string vacío', () => {
    expect(generateColorFromString('')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('usa default cuando string es whitespace', () => {
    expect(generateColorFromString('   ')).toBe(generateColorFromString('   '));
  });
});

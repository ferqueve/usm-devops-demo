import { describe, it, expect } from 'vitest';
import { truncateText, formatNameForDisplay } from '@/lib/utils/text-formatters';

describe('truncateText', () => {
  it('no trunca si es corto', () => {
    expect(truncateText('hola', 10)).toBe('hola');
  });

  it('trunca y agrega sufijo', () => {
    expect(truncateText('1234567890', 5)).toBe('12...');
  });

  it('sufijo personalizado', () => {
    expect(truncateText('1234567890', 6, '!')).toBe('12345!');
  });
});

describe('formatNameForDisplay', () => {
  it('nombre corto se devuelve igual', () => {
    expect(formatNameForDisplay('Juan', 20)).toBe('Juan');
  });

  it('nombre largo se trunca', () => {
    const r = formatNameForDisplay('A'.repeat(30), 10);
    expect(r.length).toBeLessThanOrEqual(10);
    expect(r).toContain('...');
  });
});

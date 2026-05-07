import { describe, it, expect } from 'vitest';
import {
  formatEmailForDisplay,
  truncateText,
  formatNameForSidebar,
  formatNameForDisplay,
} from '@/lib/utils/text-formatters';

describe('formatEmailForDisplay', () => {
  it('email corto no requiere break', () => {
    const r = formatEmailForDisplay('a@b.co', 18);
    expect(r.needsBreak).toBe(false);
    expect(r.firstLine).toBe('a@b.co');
  });

  it('email sin "@" se devuelve sin break', () => {
    const r = formatEmailForDisplay('thisIsAVeryLongStringWithoutAt', 18);
    expect(r.needsBreak).toBe(false);
  });

  it('divide por @ cuando username y dominio caben', () => {
    const r = formatEmailForDisplay('mathias@adavance.com', 12);
    expect(r.needsBreak).toBe(true);
    expect(r.firstLine).toBe('mathias@');
    expect(r.secondLine).toBe('adavance.com');
  });

  it('divide username largo por puntos', () => {
    const r = formatEmailForDisplay('foo.bar.baz@x.co', 6);
    expect(r.needsBreak).toBe(true);
    expect(r.firstLine).toBeTruthy();
    expect(r.secondLine).toBeTruthy();
  });

  it('truncamiento fallback', () => {
    const r = formatEmailForDisplay('aaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbb', 5);
    expect(r.firstLine.length).toBeLessThanOrEqual(20);
  });
});

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

describe('formatNameForSidebar', () => {
  it('no rompe si cabe', () => {
    const r = formatNameForSidebar('Juan', 28);
    expect(r.needsBreak).toBe(false);
    expect(r.firstLine).toBe('Juan');
  });

  it('palabra única larga -> trunca', () => {
    const r = formatNameForSidebar('A'.repeat(40), 16);
    expect(r.needsBreak).toBe(false);
    expect(r.firstLine).toContain('...');
  });

  it('dos palabras -> rompe en dos líneas', () => {
    const r = formatNameForSidebar('Juan Perez', 8);
    expect(r.needsBreak).toBe(true);
    expect(r.firstLine).toBe('Juan');
    expect(r.secondLine).toBe('Perez');
  });

  it('múltiples palabras -> distribuye', () => {
    const r = formatNameForSidebar('Juan Carlos Perez Lopez', 12);
    expect(r.firstLine.length).toBeLessThanOrEqual(12);
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

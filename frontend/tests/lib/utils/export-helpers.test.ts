import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { csvEscape, todayIsoDate, formatReportTimestamp, downloadBlob, buildAndDownloadCsv } from '@/lib/utils/export-helpers';

describe('csvEscape', () => {
  it('null/undefined -> ""', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('string simple se envuelve en comillas', () => {
    expect(csvEscape('hola')).toBe('"hola"');
  });

  it('escapa comillas dobles duplicándolas', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
});

describe('todayIsoDate', () => {
  it('devuelve YYYY-MM-DD', () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatReportTimestamp', () => {
  it('devuelve un string no vacío', () => {
    const r = formatReportTimestamp();
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  it('respeta el patrón explícito', () => {
    const r = formatReportTimestamp('yyyy-MM-dd');
    expect(r).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('downloadBlob / buildAndDownloadCsv', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let createObjectUrlSpy: ReturnType<typeof vi.fn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectUrlSpy = vi.fn(() => 'blob:fake');
    revokeObjectUrlSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectUrlSpy as unknown as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectUrlSpy as unknown as typeof URL.revokeObjectURL;
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
  });

  it('downloadBlob crea un link y revoca la URL', () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    downloadBlob(blob, 'a.txt');
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalled();
  });

  it('buildAndDownloadCsv arma headers y filas', () => {
    buildAndDownloadCsv(['a', 'b'], [[1, 2], [3, 4]], 'data.csv');
    expect(createObjectUrlSpy).toHaveBeenCalled();
  });
});

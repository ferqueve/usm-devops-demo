import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { InventarioItem, Espacio } from '@/lib/types/spaces';

const buildAndDownloadCsvMock = vi.fn();
const downloadBlobMock = vi.fn();
const csvEscapeMock = vi.fn((value: string | null | undefined) =>
  value === null || value === undefined ? '' : `"${value}"`,
);
const todayIsoDateMock = vi.fn(() => '2026-05-06');
const formatDateOnlyMock = vi.fn((iso: string) => `D(${iso})`);
const exportarUsuariosMock = vi.fn();

vi.mock('@/lib/utils/export-helpers', () => ({
  buildAndDownloadCsv: (...args: unknown[]) => buildAndDownloadCsvMock(...args),
  csvEscape: (v: string | null | undefined) => csvEscapeMock(v),
  downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
  todayIsoDate: () => todayIsoDateMock(),
}));

vi.mock('@/lib/utils/timezone', () => ({
  formatDateOnly: (iso: string) => formatDateOnlyMock(iso),
}));

vi.mock('@/lib/api/users', () => ({
  usuariosApi: {
    exportarUsuarios: (...args: unknown[]) => exportarUsuariosMock(...args),
  },
}));

import {
  exportUsersToCSV,
  exportInventarioToCSV,
  exportEspaciosToCSV,
} from '@/lib/utils/csv-export';

describe('csv-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exportUsersToCSV pide el blob a la API y dispara la descarga', async () => {
    const fakeBlob = new Blob(['x'], { type: 'text/csv' });
    exportarUsuariosMock.mockResolvedValueOnce(fakeBlob);

    await exportUsersToCSV({ search: 'foo' } as never);

    expect(exportarUsuariosMock).toHaveBeenCalledWith({ search: 'foo' });
    expect(downloadBlobMock).toHaveBeenCalledWith(fakeBlob, 'usuarios_2026-05-06.csv');
  });

  it('exportUsersToCSV envuelve errores de API', async () => {
    exportarUsuariosMock.mockRejectedValueOnce(new Error('boom'));
    await expect(exportUsersToCSV()).rejects.toThrow(/Error al exportar usuarios/);
  });

  it('exportInventarioToCSV arma headers y filas con fallback de espacio', () => {
    const items: InventarioItem[] = [
      {
        id: 1,
        espacioId: 10,
        espacioNombre: 'Aula A',
        tipoElementoId: 5,
        tipoElementoNombre: 'Silla',
        cantidad: 4,
        estado: 'DISPONIBLE',
        observaciones: 'ok',
        activo: true,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
      {
        id: 2,
        espacioId: null,
        espacioNombre: '',
        tipoElementoId: 6,
        tipoElementoNombre: 'Mesa',
        cantidad: 1,
        estado: 'DANADO',
        activo: true,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
    ];

    exportInventarioToCSV(items);

    expect(buildAndDownloadCsvMock).toHaveBeenCalledTimes(1);
    const [headers, rows, filename] = buildAndDownloadCsvMock.mock.calls[0];
    expect(headers).toContain('Espacio');
    expect(filename).toBe('inventario_2026-05-06.csv');
    expect(rows[0][1]).toBe('Aula A');
    expect(rows[1][1]).toBe('Sin asignar');
    expect(csvEscapeMock).toHaveBeenCalledWith('ok');
    expect(csvEscapeMock).toHaveBeenCalledWith('');
  });

  it('exportEspaciosToCSV formatea activo/sin tipo y fechas', () => {
    const espacios: Espacio[] = [
      {
        id: 1,
        nombre: 'Sala A',
        capacidad: 30,
        tipoEspacioId: 1,
        tipoEspacioNombre: 'Aula',
        estado: 'DISPONIBLE',
        activo: true,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
      {
        id: 2,
        nombre: 'Sala B',
        capacidad: 10,
        tipoEspacioId: 2,
        estado: 'DISPONIBLE',
        activo: false,
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-02T00:00:00Z',
      },
    ];

    exportEspaciosToCSV(espacios);

    expect(buildAndDownloadCsvMock).toHaveBeenCalledTimes(1);
    const [, rows, filename] = buildAndDownloadCsvMock.mock.calls[0];
    expect(filename).toBe('espacios_2026-05-06.csv');
    expect(rows[0][3]).toBe('Aula');
    expect(rows[0][4]).toBe('Sí');
    expect(rows[1][3]).toBe('Sin tipo');
    expect(rows[1][4]).toBe('No');
    expect(formatDateOnlyMock).toHaveBeenCalledWith('2026-05-01T00:00:00Z');
  });

  it('exportInventarioToCSV envuelve errores del builder', () => {
    buildAndDownloadCsvMock.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    expect(() => exportInventarioToCSV([])).toThrow(/Error al exportar inventario/);
  });
});

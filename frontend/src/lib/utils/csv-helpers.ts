/**
 * Helpers de descarga y CSV. Viven aparte de export-helpers a proposito: ese
 * modulo importa jsPDF, y las pantallas que solo exportan CSV -- Inventario,
 * Espacios, Usuarios -- se bajaban 275 KB de libreria de PDF sin usarla.
 */

/** Devuelve la fecha de hoy en formato ISO YYYY-MM-DD. */
export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Dispara una descarga del blob como un archivo con el nombre indicado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

/** Escapa un valor para incluirlo en una celda CSV (envuelve en comillas y duplica `"`). */
export function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return `"${value.replaceAll('"', '""')}"`;
}

/**
 * Descarga las filas ya armadas como un CSV.
 *
 * El `\uFEFF` del principio es el BOM: sin él, Excel abre el archivo como
 * latin-1 y los acentos salen rotos. Estaba escrito a mano en seis lugares
 * —las tres pantallas de Estadísticas y las tres exportaciones de
 * inscriptos—, y justamente `buildAndDownloadCsv`, que era el helper, no lo
 * ponía: los CSV que pasaban por ahí salían mal.
 */
export function descargarCSV(filas: readonly string[], nombre: string): void {
  const blob = new Blob([`\uFEFF${filas.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, nombre);
}

/** Construye y dispara la descarga de un CSV a partir de encabezados y filas. */
export function buildAndDownloadCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
  filename: string,
): void {
  descargarCSV([headers.join(','), ...rows.map((row) => row.join(','))], filename);
}

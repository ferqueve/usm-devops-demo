import jsPDF from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Helpers compartidos para exportar datos a CSV/PDF.
 * Centraliza la lógica duplicada en csv-export.ts, audit-export.ts y pdf-export.ts:
 *   - descarga de blobs (CSV / PDF)
 *   - escape CSV
 *   - extensión de jsPDF con `lastAutoTable`
 *   - render de portada y tabla en PDF
 */

/** Extiende jsPDF para acceder a `lastAutoTable.finalY` que setea jspdf-autotable. */
export interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export type RGB = [number, number, number];

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

/** Construye y dispara la descarga de un CSV a partir de encabezados y filas. */
export function buildAndDownloadCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
  filename: string,
): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Renderiza el bloque "Filtros Aplicados" en una posición dada.
 * Devuelve la nueva yPos (sin cambios si no hay texto).
 */
export function drawFiltersBox(
  doc: ExtendedJsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  filterText: string,
): number {
  if (!filterText) return yPos;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Filtros Aplicados:', margin + 2, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(filterText, margin + 2, yPos + 10);
  return yPos + 18;
}

/**
 * Render genérico de tabla con jspdf-autotable usando estilos consistentes.
 * Devuelve la nueva yPos justo después de la tabla (con padding).
 */
export function renderAutoTable(
  doc: ExtendedJsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][],
  color: RGB,
  margin: number,
  options: Partial<UserOptions> = {},
): number {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin },
    ...options,
  });
  return (doc.lastAutoTable?.finalY ?? startY) + 8;
}

/** Devuelve la fecha de generación localizada para portadas de reportes. */
export function formatReportTimestamp(pattern = 'dd \'de\' MMMM \'de\' yyyy, HH:mm'): string {
  return format(new Date(), pattern, { locale: es });
}

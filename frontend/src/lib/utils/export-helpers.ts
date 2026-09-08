import jsPDF from 'jspdf';
import { buildAndDownloadCsv, csvEscape, downloadBlob, todayIsoDate } from './csv-helpers';
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

// Se re-exportan para no romper a quien ya los importaba de acá; lo nuevo
// deberia tomarlos de csv-helpers y no arrastrar jsPDF.
export { buildAndDownloadCsv, csvEscape, downloadBlob, todayIsoDate };

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

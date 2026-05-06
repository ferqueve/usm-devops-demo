import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLog, AuditLogFilters } from '../types/audit';
import {
  buildAndDownloadCsv,
  csvEscape,
  type ExtendedJsPDF,
  type RGB,
  renderAutoTable,
  todayIsoDate,
} from './export-helpers';

const PRIMARY_COLOR: RGB = [82, 89, 97]; // #525961
const SUCCESS_COLOR: RGB = [34, 197, 94]; // #22c55e

/**
 * Exporta logs de auditoría a CSV
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): void {
  try {
    const headers = [
      'ID',
      'Entidad',
      'ID Entidad',
      'Acción',
      'Usuario',
      'Email',
      'Fecha/Hora',
      'Datos Previos',
      'Datos Nuevos',
    ];

    const rows = logs.map((log) => [
      log.id,
      csvEscape(log.entidad),
      log.entidadId,
      log.accion,
      log.usuarioNombre ? csvEscape(log.usuarioNombre) : 'N/A',
      log.usuarioEmail ? csvEscape(log.usuarioEmail) : 'N/A',
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.datosPrevios ? csvEscape(log.datosPrevios) : '',
      log.datosNuevos ? csvEscape(log.datosNuevos) : '',
    ]);

    buildAndDownloadCsv(headers, rows, `auditoria_${todayIsoDate()}.csv`);
  } catch (error) {
    console.error('Error al exportar auditoría a CSV:', error);
    throw new Error('Error al exportar auditoría. Intenta nuevamente.');
  }
}

function buildAuditFilterRows(filters: AuditLogFilters): string[][] {
  const rows: string[][] = [];
  if (filters.entidad) rows.push(['Entidad', filters.entidad]);
  if (filters.usuarioId) rows.push(['Usuario ID', filters.usuarioId.toString()]);
  if (filters.accion) rows.push(['Acción', filters.accion]);
  if (filters.fechaDesde) rows.push(['Fecha Desde', format(new Date(filters.fechaDesde), 'dd/MM/yyyy HH:mm', { locale: es })]);
  if (filters.fechaHasta) rows.push(['Fecha Hasta', format(new Date(filters.fechaHasta), 'dd/MM/yyyy HH:mm', { locale: es })]);
  if (filters.search) rows.push(['Búsqueda', filters.search]);
  return rows;
}

function renderAuditCover(doc: ExtendedJsPDF, margin: number): number {
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, 210, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Auditoría', margin, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}`, margin, 35);

  doc.setTextColor(0, 0, 0);
  return 60;
}

/**
 * Exporta logs de auditoría a PDF
 */
export function exportAuditLogsToPDF(
  logs: AuditLog[],
  filters?: AuditLogFilters
): void {
  try {
    const doc = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
    const margin = 15;
    let yPos = 20;

    const addSectionTitle = (title: string, color: RGB) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, margin, yPos);
      yPos += 8;
      doc.setTextColor(0, 0, 0);
    };

    yPos = renderAuditCover(doc, margin);

    const filterRows = filters ? buildAuditFilterRows(filters) : [];
    if (filterRows.length > 0) {
      addSectionTitle('FILTROS APLICADOS', PRIMARY_COLOR);
      yPos = renderAutoTable(doc, yPos, [['Filtro', 'Valor']], filterRows, PRIMARY_COLOR, margin);
      yPos += 2;
    }

    addSectionTitle('RESUMEN EJECUTIVO', SUCCESS_COLOR);

    const totalLogs = logs.length;
    const createCount = logs.filter((l) => l.accion === 'CREATE').length;
    const updateCount = logs.filter((l) => l.accion === 'UPDATE').length;
    const deleteCount = logs.filter((l) => l.accion === 'DELETE').length;

    const summaryData = [
      ['Total de Registros', totalLogs.toString()],
      ['Creaciones', createCount.toString()],
      ['Actualizaciones', updateCount.toString()],
      ['Eliminaciones', deleteCount.toString()],
    ];

    yPos = renderAutoTable(doc, yPos, [['Métrica', 'Valor']], summaryData, SUCCESS_COLOR, margin);
    yPos += 2;

    addSectionTitle('REGISTROS DE AUDITORÍA', PRIMARY_COLOR);

    const tableData = logs.map((log) => [
      log.id.toString(),
      log.entidad,
      log.entidadId.toString(),
      log.accion,
      log.usuarioNombre || 'Sistema',
      log.usuarioEmail || 'N/A',
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es }),
      log.datosPrevios ? 'Sí' : 'No',
      log.datosNuevos ? 'Sí' : 'No',
    ]);

    renderAutoTable(
      doc,
      yPos,
      [['ID', 'Entidad', 'ID Ent.', 'Acción', 'Usuario', 'Email', 'Fecha/Hora', 'Previos', 'Nuevos']],
      tableData,
      PRIMARY_COLOR,
      margin,
      {
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 },
          5: { cellWidth: 40 },
          6: { cellWidth: 30 },
          7: { cellWidth: 15 },
          8: { cellWidth: 15 },
        },
      },
    );

    doc.save(`auditoria_${todayIsoDate()}.pdf`);
  } catch (error) {
    console.error('Error al exportar auditoría a PDF:', error);
    throw new Error('Error al exportar auditoría a PDF. Intenta nuevamente.');
  }
}

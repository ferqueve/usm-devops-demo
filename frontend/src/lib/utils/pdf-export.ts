import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { InventoryStats, ReservaStats } from '@/lib/types/spaces';
import {
  drawFiltersBox,
  type ExtendedJsPDF,
  formatReportTimestamp,
  type RGB,
  renderAutoTable,
} from './export-helpers';

interface ExportFilters {
  espacioNombre?: string;
  tipoElementoNombre?: string;
  estado?: string;
}

// Colores compartidos para reportes PDF
const PDF_COLORS = {
  primary: [33, 150, 243] as RGB,
  success: [76, 175, 80] as RGB,
  warning: [255, 152, 0] as RGB,
  danger: [244, 67, 54] as RGB,
  gray: [158, 158, 158] as RGB,
  teal: [0, 150, 136] as RGB,
  purple: [156, 39, 176] as RGB,
  deepPurple: [103, 58, 183] as RGB,
};

// Función auxiliar para formatear diferencia del mes anterior
function formatMesAnterior(diferencia: number, porcentaje: number): string {
  if (diferencia === 0) return '-';
  const signo = diferencia > 0 ? '+' : '';
  const signoPorcentaje = porcentaje > 0 ? '+' : '';
  return `${signo}${diferencia} (${signoPorcentaje}${porcentaje.toFixed(1)}%)`;
}

// Salto de página si no entra requiredHeight; devuelve el nuevo yPos.
function pageBreakIfNeeded(
  doc: ExtendedJsPDF,
  yPos: number,
  pageHeight: number,
  margin: number,
  requiredHeight: number,
): number {
  if (yPos + requiredHeight > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return yPos;
}

// Dibuja una banda de título de sección y devuelve el nuevo yPos.
function drawSectionTitleBlock(
  doc: ExtendedJsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  title: string,
  color: RGB,
): number {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 2, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  return yPos + 12;
}

// Función auxiliar para agregar pie de página
function addFooter(doc: ExtendedJsPDF, pageWidth: number, pageHeight: number, grayColor: RGB): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'UTEC Space Manager - Sistema de Gestión de Espacios',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }
}

/**
 * Contexto compartido para los renderizadores de un PDF.
 * Centraliza los argumentos repetidos (`doc`, `pageWidth`, `pageHeight`, `margin`, `yPos`)
 * para evitar que cada función los reciba uno por uno.
 */
interface PdfCtx<TStats> {
  doc: ExtendedJsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  yPos: number;
  stats: TStats;
}

function checkPageBreak<T>(ctx: PdfCtx<T>, requiredHeight: number): void {
  ctx.yPos = pageBreakIfNeeded(ctx.doc, ctx.yPos, ctx.pageHeight, ctx.margin, requiredHeight);
}

function addSectionTitle<T>(ctx: PdfCtx<T>, title: string, color: RGB): void {
  checkPageBreak(ctx, 10);
  ctx.yPos = drawSectionTitleBlock(ctx.doc, ctx.yPos, ctx.pageWidth, ctx.margin, title, color);
}

function renderTable<T>(
  ctx: PdfCtx<T>,
  head: string[][],
  body: (string | number)[][],
  color: RGB,
  options?: Parameters<typeof renderAutoTable>[6],
): void {
  ctx.yPos = renderAutoTable(ctx.doc, ctx.yPos, head, body, color, ctx.margin, options);
}

/**
 * Crea el contexto base de un PDF nuevo y dibuja la portada genérica.
 * Devuelve el contexto con yPos posicionada después de la portada y los filtros.
 */
function createPdfWithCover<T>(
  stats: T,
  title: string,
  filterText: string,
): PdfCtx<T> {
  const doc = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const [r, g, b] = PDF_COLORS.primary;
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el ${formatReportTimestamp()}`, pageWidth / 2, 32, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let yPos = 50;
  yPos = drawFiltersBox(doc, yPos, pageWidth, margin, filterText);

  return { doc, pageWidth, pageHeight, margin, yPos, stats };
}

// ============================================================================
// INVENTARIO
// ============================================================================

function buildInventoryFilterText(filters?: ExportFilters): string {
  if (!filters) return '';
  const parts: string[] = [];
  if (filters.espacioNombre) parts.push(`Espacio: ${filters.espacioNombre}`);
  if (filters.tipoElementoNombre) parts.push(`Tipo: ${filters.tipoElementoNombre}`);
  if (filters.estado && filters.estado !== 'todos') parts.push(`Estado: ${filters.estado}`);
  return parts.join(' | ');
}

function renderInventoryResumen(ctx: PdfCtx<InventoryStats>): void {
  const { stats } = ctx;
  addSectionTitle(ctx, 'RESUMEN EJECUTIVO', PDF_COLORS.primary);
  checkPageBreak(ctx, 30);
  const summaryData = [
    ['Total Items', stats.totalItems.toString(), `${stats.totalCantidad} unidades`],
    ['Disponibles', stats.disponibles.toString(), `${stats.porcentajeDisponibles.toFixed(1)}%`],
    ['En Mantenimiento', stats.mantenimiento.toString(), `${stats.porcentajeMantenimiento.toFixed(1)}%`],
    ['Dañados', stats.danados.toString(), `${stats.porcentajeDanados.toFixed(1)}%`],
    ['Asignados', stats.asignados.toString(), `${stats.porcentajeAsignados.toFixed(1)}%`],
    ['Sin Asignar', stats.sinAsignar.toString(), `${stats.porcentajeSinAsignar.toFixed(1)}%`],
  ];
  renderTable(ctx, [['Métrica', 'Cantidad', 'Porcentaje']], summaryData, PDF_COLORS.primary);

  // Métricas de salud
  const { doc, margin, pageWidth } = ctx;
  checkPageBreak(ctx, 15);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, ctx.yPos, pageWidth - 2 * margin, 10, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores de Salud:', margin + 2, ctx.yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Ratio de Salud: ${stats.ratioSalud.toFixed(1)}% | Ratio de Problemas: ${stats.ratioProblemas.toFixed(1)}% | Cobertura: ${stats.indiceCobertura.toFixed(1)}%`,
    margin + 2,
    ctx.yPos + 8,
  );
  ctx.yPos += 15;
}

function renderInventoryTemporal(ctx: PdfCtx<InventoryStats>): void {
  const { stats } = ctx;
  addSectionTitle(ctx, 'ANALISIS TEMPORAL', PDF_COLORS.success);
  checkPageBreak(ctx, 25);
  const temporalData = [
    ['Creados Este Mes', stats.itemsCreadosEsteMes.toString(), formatMesAnterior(stats.diferenciaMesAnterior, stats.porcentajeCambioMesAnterior)],
    ['Creados Este Año', stats.itemsCreadosEsteAnio.toString(), `Últimos 6 meses: ${stats.itemsCreadosUltimos6Meses}`],
    ['Actualizados Este Mes', stats.itemsActualizadosEsteMes.toString(), `Últimos 7 días: ${stats.itemsActualizadosUltimos7Dias}`],
    ['Antigüedad Promedio', `${Math.round(stats.promedioAntiguedadDias)} días`, `${Math.round(stats.promedioTiempoSinActualizarDias)} días sin actualizar`],
  ];
  renderTable(ctx, [['Período', 'Cantidad', 'Detalles']], temporalData, PDF_COLORS.success);
}

function renderInventoryRankings(ctx: PdfCtx<InventoryStats>): void {
  const { stats, doc, margin } = ctx;
  addSectionTitle(ctx, 'TOP RANKINGS', PDF_COLORS.warning);

  // Top 10 Espacios
  checkPageBreak(ctx, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Espacios con Más Inventario', margin, ctx.yPos);
  ctx.yPos += 5;

  const topEspaciosData = stats.topEspacios.map((espacio, index) => [
    `#${index + 1}`,
    espacio.espacioNombre,
    espacio.items.toString(),
    `${espacio.cantidad} unidades`,
  ]);
  renderTable(ctx, [['Rank', 'Espacio', 'Items', 'Cantidad Total']], topEspaciosData, PDF_COLORS.warning);

  // Top 10 Tipos
  checkPageBreak(ctx, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Tipos de Elemento', margin, ctx.yPos);
  ctx.yPos += 5;

  const topTiposData = stats.topTipos.map((tipo, index) => [
    `#${index + 1}`,
    tipo.tipoNombre,
    tipo.items.toString(),
    `${tipo.cantidad} unidades`,
  ]);
  renderTable(ctx, [['Rank', 'Tipo de Elemento', 'Items', 'Cantidad Total']], topTiposData, PDF_COLORS.warning);
}

function renderInventoryCriticos(ctx: PdfCtx<InventoryStats>): void {
  const { stats, doc, margin } = ctx;
  if (stats.itemsCriticos <= 0 && stats.espaciosSinInventario <= 0) return;

  addSectionTitle(ctx, 'ITEMS CRITICOS Y ALERTAS', PDF_COLORS.danger);

  checkPageBreak(ctx, 20);
  const criticalData = [
    ['Items Críticos Totales', stats.itemsCriticos.toString()],
    ['Sin Asignar + Problemas', stats.itemsSinAsignarConProblemas.toString()],
    ['Espacios Sin Inventario', stats.espaciosSinInventario.toString()],
    ['Tipos Sin Items', stats.tiposSinItems.toString()],
  ];
  renderTable(ctx, [['Alerta', 'Cantidad']], criticalData, PDF_COLORS.danger);

  if (stats.espaciosConMasProblemas.length > 0) {
    checkPageBreak(ctx, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Espacios con Más Problemas', margin, ctx.yPos);
    ctx.yPos += 5;

    const problemasEspaciosData = stats.espaciosConMasProblemas.map((espacio) => [
      espacio.espacioNombre,
      espacio.problemas.toString(),
      `${espacio.porcentaje.toFixed(1)}%`,
    ]);
    renderTable(ctx, [['Espacio', 'Problemas', '% del Inventario']], problemasEspaciosData, PDF_COLORS.danger);
  }
}

function renderInventoryDistribucion(ctx: PdfCtx<InventoryStats>): void {
  const { stats, doc, margin } = ctx;
  addSectionTitle(ctx, 'ANALISIS DE DISTRIBUCION', PDF_COLORS.purple);

  checkPageBreak(ctx, 40);
  const distribucionData = [
    ['Items por Espacio (Promedio)', stats.promedioItemsPorEspacio.toFixed(1)],
    ['Cantidad por Item (Promedio)', stats.promedioCantidadPorItem.toFixed(1)],
    ['Items por Tipo (Promedio)', stats.promedioItemsPorTipo.toFixed(1)],
    ['Cantidad por Espacio (Promedio)', stats.promedioCantidadPorEspacio.toFixed(1)],
    ['Cantidad por Tipo (Promedio)', stats.promedioCantidadPorTipo.toFixed(1)],
    ['Densidad de Inventario', `${stats.densidadInventario.toFixed(1)} items/espacio`],
    ['Eficiencia de Asignación', `${stats.eficienciaAsignacion.toFixed(1)}%`],
    ['Concentración de Inventario', `${stats.concentracionInventario.toFixed(1)}%`],
  ];
  renderTable(ctx, [['Métrica', 'Valor']], distribucionData, PDF_COLORS.purple);

  // Distribución por cantidad
  checkPageBreak(ctx, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribución por Cantidad', margin, ctx.yPos);
  ctx.yPos += 5;

  const cantidadData = [
    ['Cantidad 1', stats.itemsConCantidad1.toString()],
    ['Cantidad Media (2-10)', stats.itemsConCantidadMedia.toString()],
    ['Cantidad Alta (>10)', stats.itemsConCantidadAlta.toString()],
    ['Rango', `${stats.cantidadMinima} - ${stats.cantidadMaxima}`],
  ];
  renderTable(ctx, [['Rango', 'Items']], cantidadData, PDF_COLORS.purple);
}

function renderInventoryPorTipo(ctx: PdfCtx<InventoryStats>): void {
  const { stats } = ctx;
  if (stats.itemsPorTipo.length === 0) return;
  addSectionTitle(ctx, 'INVENTARIO COMPLETO POR TIPO', PDF_COLORS.teal);

  checkPageBreak(ctx, 50);
  const tipoCompletoData = stats.itemsPorTipo.map((tipo) => {
    const porcentaje = stats.totalItems > 0 ? (tipo.items / stats.totalItems) * 100 : 0;
    return [
      tipo.tipoNombre,
      tipo.items.toString(),
      tipo.cantidad.toString(),
      tipo.disponibles.toString(),
      tipo.mantenimiento.toString(),
      tipo.danados.toString(),
      `${porcentaje.toFixed(1)}%`,
    ];
  });

  renderTable(
    ctx,
    [['Tipo', 'Items', 'Cantidad', 'Disponibles', 'Mantenimiento', 'Dañados', '% del Total']],
    tipoCompletoData,
    PDF_COLORS.teal,
    {
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
      },
    },
  );
}

function renderInventoryPorEspacio(ctx: PdfCtx<InventoryStats>): void {
  const { stats } = ctx;
  if (stats.itemsPorEspacio.length === 0) return;
  addSectionTitle(ctx, 'INVENTARIO COMPLETO POR ESPACIO', PDF_COLORS.deepPurple);

  checkPageBreak(ctx, 50);
  const espacioCompletoData = stats.itemsPorEspacio.map((espacio) => [
    espacio.espacioNombre,
    espacio.items.toString(),
    espacio.cantidad.toString(),
    espacio.disponibles.toString(),
    espacio.mantenimiento.toString(),
    espacio.danados.toString(),
  ]);

  renderTable(
    ctx,
    [['Espacio', 'Items', 'Cantidad', 'Disponibles', 'Mantenimiento', 'Dañados']],
    espacioCompletoData,
    PDF_COLORS.deepPurple,
    {
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
      },
    },
  );
}

/**
 * Exporta las estadísticas de inventario a PDF con un diseño profesional
 */
export function exportInventoryStatsToPDF(
  stats: InventoryStats,
  filters?: ExportFilters
): void {
  try {
    const ctx = createPdfWithCover(stats, 'Reporte de Estadísticas de Inventario', buildInventoryFilterText(filters));

    renderInventoryResumen(ctx);
    renderInventoryTemporal(ctx);
    renderInventoryRankings(ctx);
    renderInventoryCriticos(ctx);
    renderInventoryDistribucion(ctx);
    renderInventoryPorTipo(ctx);
    renderInventoryPorEspacio(ctx);

    addFooter(ctx.doc, ctx.pageWidth, ctx.pageHeight, PDF_COLORS.gray);

    const fecha = format(new Date(), 'yyyy-MM-dd');
    ctx.doc.save(`estadisticas_inventario_${fecha}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

// ============================================================================
// RESERVAS
// ============================================================================

interface ReservationExportFilters {
  espacioNombre?: string;
  carreraNombre?: string;
}

function buildReservationFilterText(filters?: ReservationExportFilters): string {
  if (!filters) return '';
  const parts: string[] = [];
  if (filters.espacioNombre) parts.push(`Espacio: ${filters.espacioNombre}`);
  if (filters.carreraNombre) parts.push(`Carrera: ${filters.carreraNombre}`);
  return parts.join(' | ');
}

function safePercent(part: number, total: number): string {
  return total > 0 ? ((part / total) * 100).toFixed(1) : '0';
}

function formatHoursLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === Math.floor(hours)) return `${Math.floor(hours)}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}min`;
}

function formatChangeLabel(diferencia: number, porcentaje: number): string {
  const signoDif = diferencia > 0 ? '+' : '';
  const signoPct = porcentaje > 0 ? '+' : '';
  return `Cambio: ${signoDif}${diferencia} (${signoPct}${porcentaje.toFixed(1)}%)`;
}

function renderResumenEjecutivo(ctx: PdfCtx<ReservaStats>): void {
  addSectionTitle(ctx, 'RESUMEN EJECUTIVO', PDF_COLORS.primary);
  checkPageBreak(ctx, 40);
  const { stats } = ctx;
  const porcentajeAprobadas = safePercent(stats.totalAprobadas, stats.totalReservas);
  const porcentajePendientes = safePercent(stats.totalPendientes, stats.totalReservas);
  const porcentajeCanceladas = safePercent(stats.totalCanceladas, stats.totalReservas);
  const summaryData = [
    ['Total Reservas', stats.totalReservas.toString()],
    ['Aprobadas', `${stats.totalAprobadas} (${porcentajeAprobadas}%)`],
    ['Pendientes', `${stats.totalPendientes} (${porcentajePendientes}%)`],
    ['Canceladas', `${stats.totalCanceladas} (${porcentajeCanceladas}%)`],
    ['Futuras', stats.totalFuturas.toString()],
    ['Pasadas', stats.totalPasadas.toString()],
    ['Activas', stats.totalActivas.toString()],
  ];
  renderTable(ctx, [['Métrica', 'Valor']], summaryData, PDF_COLORS.primary);
}

function renderAnalisisTemporal(ctx: PdfCtx<ReservaStats>): void {
  addSectionTitle(ctx, 'ANALISIS TEMPORAL', PDF_COLORS.success);
  checkPageBreak(ctx, 30);
  const { stats } = ctx;
  const temporalData = [
    ['Reservas Este Mes', stats.reservasEsteMes.toString(), formatChangeLabel(stats.diferenciaMesAnterior, stats.porcentajeCambioMesAnterior)],
    ['Reservas Próximo Mes', stats.reservasProximoMes.toString(), 'Reservas programadas'],
    ['Reservas Este Año', stats.reservasEsteAnio.toString(), `Promedio: ${stats.promedioReservasPorMes.toFixed(1)}/mes`],
    ['Promedio Semanal', stats.promedioReservasPorSemana.toFixed(1), `${stats.promedioReservasPorMes.toFixed(1)} por mes`],
    ['Mes con Más Reservas', stats.mesConMasReservas || 'N/A', ''],
  ];
  renderTable(ctx, [['Período', 'Cantidad', 'Detalles']], temporalData, PDF_COLORS.success);
}

function renderAnalisisDuracion(ctx: PdfCtx<ReservaStats>): void {
  addSectionTitle(ctx, 'ANALISIS DE DURACION', PDF_COLORS.warning);
  checkPageBreak(ctx, 25);
  const { stats } = ctx;
  const duracionData = [
    ['Duración Total', formatHoursLabel(stats.duracionTotalHoras)],
    ['Duración Promedio', formatHoursLabel(stats.duracionPromedioHoras)],
    ['Reserva Más Larga', formatHoursLabel(stats.reservaMasLargaHoras)],
    ['Reserva Más Corta', formatHoursLabel(stats.reservaMasCortaHoras)],
    ['Horas Este Mes', formatHoursLabel(stats.horasReservadasEsteMes)],
  ];
  renderTable(ctx, [['Métrica', 'Valor']], duracionData, PDF_COLORS.warning);
}

function renderAnalisisEspacios(ctx: PdfCtx<ReservaStats>): void {
  addSectionTitle(ctx, 'ANALISIS DE ESPACIOS', PDF_COLORS.primary);
  checkPageBreak(ctx, 20);
  const { stats } = ctx;
  const espaciosData = [
    ['Total Espacios Usados', stats.totalEspaciosUsados.toString()],
    ['Espacio Más Usado', stats.nombreEspacioMasUsado || 'N/A'],
  ];
  renderTable(ctx, [['Métrica', 'Valor']], espaciosData, PDF_COLORS.primary);

  if (stats.reservasPorEspacio && Object.keys(stats.reservasPorEspacio).length > 0) {
    checkPageBreak(ctx, 30);
    ctx.doc.setFontSize(10);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.text('Top 10 Espacios Más Reservados', ctx.margin, ctx.yPos);
    ctx.yPos += 5;
    const sortedEspacios = Object.entries(stats.reservasPorEspacio)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const topEspaciosData = sortedEspacios.map(([espacioId, cantidad], index) => [
      `#${index + 1}`,
      `Espacio ${espacioId}`,
      cantidad.toString(),
    ]);
    renderTable(ctx, [['Rank', 'Espacio', 'Reservas']], topEspaciosData, PDF_COLORS.primary);
  }
}

function renderReservasPorMes(ctx: PdfCtx<ReservaStats>): void {
  const { stats } = ctx;
  if (!stats.reservasPorMes || Object.keys(stats.reservasPorMes).length === 0) return;
  addSectionTitle(ctx, 'RESERVAS POR MES', PDF_COLORS.success);
  checkPageBreak(ctx, 40);
  ctx.doc.setFontSize(10);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.text('Distribución Mensual', ctx.margin, ctx.yPos);
  ctx.yPos += 5;
  const reservasPorMesData = Object.entries(stats.reservasPorMes)
    .map(([mes, cantidad]) => [mes, cantidad.toString()])
    .sort(([a], [b]) => a.localeCompare(b));
  renderTable(ctx, [['Mes', 'Cantidad']], reservasPorMesData, PDF_COLORS.success);
}

function renderReservasPorDiaSemana(ctx: PdfCtx<ReservaStats>): void {
  const { stats } = ctx;
  if (!stats.reservasPorDiaSemana || Object.keys(stats.reservasPorDiaSemana).length === 0) return;
  addSectionTitle(ctx, 'RESERVAS POR DIA DE SEMANA', PDF_COLORS.warning);
  checkPageBreak(ctx, 30);
  ctx.doc.setFontSize(10);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.text('Distribución por Día de Semana', ctx.margin, ctx.yPos);
  ctx.yPos += 5;
  const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const reservasPorDiaData = Object.entries(stats.reservasPorDiaSemana)
    .map(([dia, cantidad]) => ({
      dia,
      cantidad,
      orden: diasOrden.includes(dia) ? diasOrden.indexOf(dia) : 99,
    }))
    .sort((a, b) => a.orden - b.orden)
    .map(({ dia, cantidad }) => [dia, cantidad.toString()]);
  renderTable(ctx, [['Día', 'Cantidad']], reservasPorDiaData, PDF_COLORS.warning);
}

function buildInfoAdicionalData(stats: ReservaStats): string[][] {
  const infoData: string[][] = [];
  if (stats.fechaUltimaReserva) {
    const fechaUltima = format(new Date(stats.fechaUltimaReserva), 'dd MMM yyyy, HH:mm', { locale: es });
    infoData.push(['Última Reserva', fechaUltima]);
    if (stats.diasDesdeUltimaReserva !== null && stats.diasDesdeUltimaReserva !== undefined) {
      infoData.push(['Días desde Última', `${stats.diasDesdeUltimaReserva} días`]);
    }
  }
  if (stats.fechaProximaReserva) {
    const fechaProxima = format(new Date(stats.fechaProximaReserva), 'dd MMM yyyy, HH:mm', { locale: es });
    infoData.push(['Próxima Reserva', fechaProxima]);
    if (stats.diasHastaProximaReserva !== null && stats.diasHastaProximaReserva !== undefined) {
      infoData.push(['Días hasta Próxima', `${stats.diasHastaProximaReserva} días`]);
    }
  }
  return infoData;
}

function renderInformacionAdicional(ctx: PdfCtx<ReservaStats>): void {
  const { stats } = ctx;
  if (!stats.fechaUltimaReserva && !stats.fechaProximaReserva) return;
  addSectionTitle(ctx, 'INFORMACION ADICIONAL', PDF_COLORS.gray);
  checkPageBreak(ctx, 20);
  const infoData = buildInfoAdicionalData(stats);
  if (infoData.length > 0) {
    renderTable(ctx, [['Información', 'Valor']], infoData, PDF_COLORS.gray);
  }
}

/**
 * Exporta las estadísticas de reservas a PDF con un diseño profesional
 */
export function exportReservationStatsToPDF(
  stats: ReservaStats,
  filters?: ReservationExportFilters
): void {
  try {
    const ctx = createPdfWithCover(stats, 'Reporte de Estadísticas de Reservas', buildReservationFilterText(filters));

    renderResumenEjecutivo(ctx);
    renderAnalisisTemporal(ctx);
    renderAnalisisDuracion(ctx);
    renderAnalisisEspacios(ctx);
    renderReservasPorMes(ctx);
    renderReservasPorDiaSemana(ctx);
    renderInformacionAdicional(ctx);

    addFooter(ctx.doc, ctx.pageWidth, ctx.pageHeight, PDF_COLORS.gray);

    const fecha = format(new Date(), 'yyyy-MM-dd');
    ctx.doc.save(`estadisticas_reservas_${fecha}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

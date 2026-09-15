import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Academico, Aprobacion, DemandaInventario, EstadoInventario, ExternosReservas, OcupacionEspacio, ResumenCarrera, ResumenEdificio, ResumenReservas, TopUsuario } from '@/lib/api/stats';
import {
  drawFiltersBox,
  type ExtendedJsPDF,
  formatReportTimestamp,
  type RGB,
  renderAutoTable,
} from './export-helpers';

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

export interface ReporteInventario {
  /** "Edificio: X | Tipo: Y", o vacío sin filtros. */
  filtrosTexto: string;
  estado: EstadoInventario;
  /** Equipos pedidos en el período, si se pudo cargar. */
  demanda?: DemandaInventario | null;
  periodoTexto?: string;
}

function renderInventarioDemanda(ctx: PdfCtx<ReporteInventario>): void {
  const { demanda, periodoTexto } = ctx.stats;
  if (!demanda || demanda.porTipo.length === 0) return;
  addSectionTitle(ctx, `DEMANDA DE EQUIPOS${periodoTexto ? ` (${periodoTexto.toUpperCase()})` : ''}`, PDF_COLORS.deepPurple);
  renderTable(
    ctx,
    [['Tipo', 'Pedidos', 'Unidades', 'Pendientes', 'Entregadas', 'Rechazadas', 'Pico diario', 'Disponibles']],
    demanda.porTipo.map((t) => [t.nombre, t.solicitudes, t.unidades, t.pendientes, t.entregadas, t.rechazadas, t.maxUnidadesDia, t.disponibles]),
    PDF_COLORS.deepPurple,
  );
}

function renderInventarioResumen(ctx: PdfCtx<ReporteInventario>): void {
  addSectionTitle(ctx, 'ESTADO ACTUAL', PDF_COLORS.primary);
  const { totales: t, cobertura } = ctx.stats.estado;
  const filas: (string | number)[][] = [
    ['Items', t.items],
    ['Unidades', t.unidades],
    ['Disponibles', `${t.disponibles} (${pct(t.disponibles, t.items)})`],
    ['En mantenimiento', t.mantenimiento],
    ['Dañados', t.danados],
    ['Sin espacio asignado', t.sinEspacio],
  ];
  if (cobertura) filas.push(['Espacios con inventario', `${cobertura.conInventario} de ${cobertura.espacios}`]);
  renderTable(ctx, [['Métrica', 'Valor']], filas, PDF_COLORS.primary);
}

function renderInventarioAtencion(ctx: PdfCtx<ReporteInventario>): void {
  const { atencion } = ctx.stats.estado;
  if (atencion.length === 0) return;
  addSectionTitle(ctx, 'REQUIEREN ATENCION', PDF_COLORS.danger);
  renderTable(
    ctx,
    [['Tipo', 'Espacio', 'Estado', 'Cantidad', 'Sin cambios (días)']],
    atencion.map((i) => [i.tipo, i.espacio ?? 'Sin espacio', i.estado === 'DANADO' ? 'Dañado' : 'Mantenimiento', i.cantidad, i.diasSinCambios]),
    PDF_COLORS.danger,
  );
}

function renderInventarioGrupos(ctx: PdfCtx<ReporteInventario>, titulo: string, columna: string,
  grupos: EstadoInventario['porTipo'], color: RGB): void {
  if (grupos.length === 0) return;
  addSectionTitle(ctx, titulo, color);
  renderTable(
    ctx,
    [[columna, 'Items', 'Unidades', 'Disponibles', 'Mantenimiento', 'Dañados']],
    grupos.map((g) => [g.detalle ? `${g.nombre} (${g.detalle})` : g.nombre, g.items, g.unidades, g.disponibles, g.mantenimiento, g.danados]),
    color,
  );
}

function renderInventarioAntiguedad(ctx: PdfCtx<ReporteInventario>): void {
  const { antiguedad: a } = ctx.stats.estado;
  addSectionTitle(ctx, 'ANTIGUEDAD', PDF_COLORS.gray);
  renderTable(
    ctx,
    [['Desde el alta', 'Items']],
    [
      ['Menos de 30 días', a.menosDe30Dias],
      ['30 a 90 días', a.de30a90Dias],
      ['90 días a 1 año', a.de90DiasAUnAnio],
      ['Más de 1 año', a.masDeUnAnio],
      ['Sin revisar hace más de 6 meses', a.sinCambiosHace6Meses],
    ],
    PDF_COLORS.gray,
  );
}

/** Exporta lo mismo que muestra el estado actual, con los filtros aplicados. */
export function exportInventarioToPDF(reporte: ReporteInventario): void {
  try {
    const ctx = createPdfWithCover(reporte, 'Estadísticas de Inventario', reporte.filtrosTexto);
    renderInventarioResumen(ctx);
    renderInventarioAtencion(ctx);
    renderInventarioGrupos(ctx, 'POR TIPO', 'Tipo', reporte.estado.porTipo, PDF_COLORS.teal);
    renderInventarioGrupos(ctx, 'POR ESPACIO', 'Espacio', reporte.estado.porEspacio, PDF_COLORS.deepPurple);
    renderInventarioAntiguedad(ctx);
    renderInventarioDemanda(ctx);
    addFooter(ctx.doc, ctx.pageWidth, ctx.pageHeight, PDF_COLORS.gray);
    ctx.doc.save(`estadisticas_inventario_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

// ============================================================================
// RESERVAS
// ============================================================================

/** Lo que muestra la pantalla de estadísticas de reservas para un período. */
export interface ReporteReservas {
  periodoTexto: string;
  resumen: ResumenReservas;
  ocupacion: OcupacionEspacio[];
  edificios: ResumenEdificio[];
  carreras: ResumenCarrera[];
  usuarios: TopUsuario[];
  /** Filtros aplicados, en texto; vacío sin filtros. */
  filtrosTexto?: string;
  aprobacion?: Aprobacion | null;
  externos?: ExternosReservas | null;
}

function pct(parte: number, total: number): string {
  return total > 0 ? `${((parte / total) * 100).toFixed(1)}%` : '0%';
}

function comparacion(actual: number, anterior: number): string {
  if (anterior <= 0) return '-';
  const cambio = ((actual - anterior) / anterior) * 100;
  return `${cambio > 0 ? '+' : ''}${cambio.toFixed(1)}%`;
}

function renderReservasResumen(ctx: PdfCtx<ReporteReservas>): void {
  addSectionTitle(ctx, 'RESUMEN DEL PERIODO', PDF_COLORS.primary);
  const { actual, anterior, espaciosTotal } = ctx.stats.resumen;
  renderTable(
    ctx,
    [['Métrica', 'Período', 'Período anterior', 'Cambio']],
    [
      ['Reservas', actual.total, anterior.total, comparacion(actual.total, anterior.total)],
      ['Aprobadas', `${actual.aprobadas} (${pct(actual.aprobadas, actual.total)})`, anterior.aprobadas, comparacion(actual.aprobadas, anterior.aprobadas)],
      ['Pendientes', actual.pendientes, anterior.pendientes, comparacion(actual.pendientes, anterior.pendientes)],
      ['Canceladas', `${actual.canceladas} (${pct(actual.canceladas, actual.total)})`, anterior.canceladas, comparacion(actual.canceladas, anterior.canceladas)],
      ['Horas aprobadas', actual.horasAprobadas.toFixed(1), anterior.horasAprobadas.toFixed(1), comparacion(actual.horasAprobadas, anterior.horasAprobadas)],
      ['Espacios usados', `${actual.espaciosUsados} de ${espaciosTotal}`, anterior.espaciosUsados, '-'],
      ['Personas que reservaron', actual.usuarios, anterior.usuarios, comparacion(actual.usuarios, anterior.usuarios)],
    ],
    PDF_COLORS.primary,
  );
}

function renderReservasSerie(ctx: PdfCtx<ReporteReservas>): void {
  const { serie, granularidad } = ctx.stats.resumen;
  if (serie.length === 0) return;
  const unidad = granularidad === 'dia' ? 'Día' : granularidad === 'semana' ? 'Semana del' : 'Mes';
  addSectionTitle(ctx, 'EVOLUCION', PDF_COLORS.success);
  renderTable(
    ctx,
    [[unidad, 'Aprobadas', 'Pendientes', 'Canceladas', 'Total']],
    serie.map((p) => [
      granularidad === 'mes' ? p.periodo.slice(0, 7) : p.periodo,
      p.aprobadas,
      p.pendientes,
      p.canceladas,
      p.aprobadas + p.pendientes + p.canceladas,
    ]),
    PDF_COLORS.success,
  );
}

function renderReservasUso(ctx: PdfCtx<ReporteReservas>): void {
  const { ocupacion, edificios } = ctx.stats;
  if (ocupacion.length > 0) {
    addSectionTitle(ctx, 'OCUPACION POR ESPACIO', PDF_COLORS.teal);
    renderTable(
      ctx,
      [['Espacio', 'Horas reservadas', 'Ocupación']],
      ocupacion.map((o) => [o.espacioNombre, Number(o.horasReservadas).toFixed(1), `${Number(o.porcentaje).toFixed(1)}%`]),
      PDF_COLORS.teal,
    );
  }
  if (edificios.length > 0) {
    addSectionTitle(ctx, 'POR EDIFICIO', PDF_COLORS.deepPurple);
    renderTable(ctx, [['Edificio', 'Reservas']], edificios.map((e) => [e.edificioNombre, e.cantReservas]), PDF_COLORS.deepPurple);
  }
}

function renderReservasQuien(ctx: PdfCtx<ReporteReservas>): void {
  const { carreras, usuarios } = ctx.stats;
  if (carreras.length > 0) {
    addSectionTitle(ctx, 'POR CARRERA', PDF_COLORS.warning);
    renderTable(
      ctx,
      [['Carrera', 'Aprobadas', 'Canceladas', 'Cancelación']],
      carreras.map((c) => [c.carreraNombre, c.aprobadas, c.canceladas, `${Number(c.tasaCancelacion).toFixed(1)}%`]),
      PDF_COLORS.warning,
    );
  }
  if (usuarios.length > 0) {
    addSectionTitle(ctx, 'QUIENES MAS RESERVAN', PDF_COLORS.purple);
    renderTable(ctx, [['Persona', 'Email', 'Reservas']], usuarios.map((u) => [u.nombre, u.email, u.cantReservas]), PDF_COLORS.purple);
  }
}

function horasPdf(h: number | null | undefined): string {
  if (h == null) return '-';
  return h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} días`;
}

function renderReservasNuevas(ctx: PdfCtx<ReporteReservas>): void {
  const { aprobacion, externos } = ctx.stats;
  if (aprobacion && aprobacion.analistas.length > 0) {
    addSectionTitle(ctx, 'APROBACION POR ANALISTA', PDF_COLORS.danger);
    renderTable(
      ctx,
      [['Analista', 'Asignadas', 'Aprobadas', 'Canceladas', 'Pendientes', 'Vencidas', 'Mediana respuesta']],
      aprobacion.analistas.map((a) => [a.nombre, a.asignadas, a.aprobadas, a.canceladas, a.pendientes, a.vencidas, horasPdf(a.medianaHoras)]),
      PDF_COLORS.danger,
    );
  }
  if (externos && externos.organizadores.length > 0) {
    addSectionTitle(ctx, 'ORGANIZADORES EXTERNOS', PDF_COLORS.deepPurple);
    renderTable(
      ctx,
      [['Organizador', 'Eventos', 'Aprobadas', 'Canceladas', 'Horas', 'Espacios']],
      externos.organizadores.map((o) => [o.organizador, o.eventos, o.aprobadas, o.canceladas, Number(o.horas).toFixed(1), o.espacios]),
      PDF_COLORS.deepPurple,
    );
  }
}

/**
 * Exporta lo mismo que muestra la pantalla para el período elegido. Antes el
 * PDF salía con los totales históricos aunque la pantalla filtrara otra cosa.
 */
export function exportReservasToPDF(reporte: ReporteReservas): void {
  try {
    const ctx = createPdfWithCover(
      reporte,
      'Estadísticas de Reservas',
      `Período: ${reporte.periodoTexto}${reporte.filtrosTexto ? ` | ${reporte.filtrosTexto}` : ''}`,
    );
    renderReservasResumen(ctx);
    renderReservasSerie(ctx);
    renderReservasUso(ctx);
    renderReservasQuien(ctx);
    renderReservasNuevas(ctx);
    addFooter(ctx.doc, ctx.pageWidth, ctx.pageHeight, PDF_COLORS.gray);
    ctx.doc.save(`estadisticas_reservas_${reporte.resumen.desde}_${reporte.resumen.hasta}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

// ============================================================================
// ACADÉMICO
// ============================================================================

export interface ReporteAcademico {
  periodoTexto: string;
  filtrosTexto: string;
  datos: Academico;
  desde: string;
  hasta: string;
}

export function exportAcademicoToPDF(reporte: ReporteAcademico): void {
  try {
    const ctx = createPdfWithCover(
      reporte,
      'Estadísticas Académicas',
      `Período: ${reporte.periodoTexto}${reporte.filtrosTexto ? ` | ${reporte.filtrosTexto}` : ''}`,
    );
    const { tutorias: t, eventos: e, porMateria, eventosLista } = reporte.datos;
    addSectionTitle(ctx, 'TUTORIAS', PDF_COLORS.warning);
    renderTable(
      ctx,
      [['Métrica', 'Valor']],
      [
        ['Tutorías', t.total],
        ['Presenciales / virtuales', `${t.presenciales} / ${t.virtuales}`],
        ['Grupales / individuales', `${t.grupales} / ${t.individuales}`],
        ['Agendadas / cupo', `${t.agendadas} / ${t.cupoTotal}`],
        ['Asistencia', t.asistenciaPct == null ? '-' : `${t.asistenciaPct.toFixed(1)}%`],
        ['Calificación', t.ratingPromedio == null ? '-' : `${t.ratingPromedio.toFixed(1)} (${t.feedbacks} opiniones)`],
      ],
      PDF_COLORS.warning,
    );
    if (porMateria.length > 0) {
      addSectionTitle(ctx, 'TUTORIAS POR MATERIA', PDF_COLORS.warning);
      renderTable(
        ctx,
        [['Materia', 'Carrera', 'Tutorías', 'Agendadas', 'Asistieron', 'Calificación']],
        porMateria.map((m) => [m.nombre, m.carreraNombre ?? '-', m.tutorias, m.agendadas, m.asistieron, m.ratingPromedio == null ? '-' : m.ratingPromedio.toFixed(1)]),
        PDF_COLORS.warning,
      );
    }
    addSectionTitle(ctx, 'EVENTOS', PDF_COLORS.success);
    renderTable(
      ctx,
      [['Evento', 'Tipo', 'Fecha', 'Espacio', 'Inscriptos', 'Cupo', 'Calificación']],
      eventosLista.map((ev) => [ev.titulo, ev.tipo, ev.fecha.slice(0, 10), ev.espacioNombre ?? '-', ev.inscriptos, ev.cupo ?? '-', ev.ratingPromedio == null ? '-' : ev.ratingPromedio.toFixed(1)]),
      PDF_COLORS.success,
    );
    ctx.yPos += 2;
    renderTable(ctx, [['Eventos', 'Inscripciones', 'Cupo total']], [[e.total, e.inscripciones, e.cupoTotal]], PDF_COLORS.success);
    addFooter(ctx.doc, ctx.pageWidth, ctx.pageHeight, PDF_COLORS.gray);
    ctx.doc.save(`estadisticas_academicas_${reporte.desde}_${reporte.hasta}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Extender el tipo de jsPDF para incluir lastAutoTable
interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface InventoryStats {
  totalItems: number;
  totalCantidad: number;
  disponibles: number;
  mantenimiento: number;
  danados: number;
  sinAsignar: number;
  asignados: number;
  itemsInactivos: number;
  porcentajeDisponibles: number;
  porcentajeMantenimiento: number;
  porcentajeDanados: number;
  porcentajeSinAsignar: number;
  porcentajeAsignados: number;
  porcentajeInactivos: number;
  itemsPorTipo: Array<{ tipoNombre: string; tipoId: number; cantidad: number; items: number; disponibles: number; mantenimiento: number; danados: number }>;
  tiposUnicos: number;
  itemsPorEspacio: Array<{ espacioNombre: string; espacioId: number; cantidad: number; items: number; disponibles: number; mantenimiento: number; danados: number }>;
  espaciosConInventario: number;
  topEspacios: Array<{ espacioNombre: string; espacioId: number; cantidad: number; items: number }>;
  topTipos: Array<{ tipoNombre: string; tipoId: number; cantidad: number; items: number }>;
  espaciosConMasProblemas: Array<{ espacioNombre: string; espacioId: number; problemas: number; porcentaje: number }>;
  tiposConMasProblemas: Array<{ tipoNombre: string; tipoId: number; problemas: number; porcentaje: number }>;
  promedioItemsPorEspacio: number;
  promedioCantidadPorItem: number;
  promedioItemsPorTipo: number;
  promedioCantidadPorEspacio: number;
  promedioCantidadPorTipo: number;
  itemsCreadosEsteMes: number;
  itemsCreadosEsteAnio: number;
  itemsCreadosUltimos6Meses: number;
  itemsCreadosUltimos12Meses: number;
  itemsActualizadosEsteMes: number;
  itemsActualizadosUltimos7Dias: number;
  itemsRecientes: number;
  itemsJovenes: number;
  itemsViejos: number;
  promedioAntiguedadDias: number;
  promedioTiempoSinActualizarDias: number;
  itemsSinActualizarMasDe6Meses: number;
  ratioSalud: number;
  ratioProblemas: number;
  ratioAsignacion: number;
  indiceCobertura: number;
  itemsCriticos: number;
  itemsSinAsignarConProblemas: number;
  espaciosSinInventario: number;
  tiposSinItems: number;
  espaciosConSoloDisponibles: number;
  espaciosConSoloMantenimiento: number;
  espaciosConSoloDanados: number;
  espaciosConMezclaEstados: number;
  tiposConSoloDisponibles: number;
  tiposConSoloMantenimiento: number;
  tiposConSoloDanados: number;
  tiposConMezclaEstados: number;
  itemsConCantidad1: number;
  itemsConCantidadAlta: number;
  itemsConCantidadMedia: number;
  cantidadMaxima: number;
  cantidadMinima: number;
  cantidadTotalPromedio: number;
  itemsConObservaciones: number;
  itemsSinObservaciones: number;
  porcentajeConObservaciones: number;
  diferenciaMesAnterior: number;
  porcentajeCambioMesAnterior: number;
  diferenciaAnioAnterior: number;
  porcentajeCambioAnioAnterior: number;
  eficienciaAsignacion: number;
  densidadInventario: number;
  concentracionInventario: number;
}

interface ExportFilters {
  espacioNombre?: string;
  tipoElementoNombre?: string;
  estado?: string;
}

// Función auxiliar para formatear diferencia del mes anterior
function formatMesAnterior(diferencia: number, porcentaje: number): string {
  if (diferencia === 0) return '-';
  const signo = diferencia > 0 ? '+' : '';
  const signoPorcentaje = porcentaje > 0 ? '+' : '';
  return `${signo}${diferencia} (${signoPorcentaje}${porcentaje.toFixed(1)}%)`;
}

// Función auxiliar para agregar pie de página
function addFooter(doc: ExtendedJsPDF, pageWidth: number, pageHeight: number, grayColor: [number, number, number]): void {
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
 * Exporta las estadísticas de inventario a PDF con un diseño profesional
 */
export function exportInventoryStatsToPDF(
  stats: InventoryStats,
  filters?: ExportFilters
): void {
  try {
    const doc = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Colores personalizados
    const primaryColor: [number, number, number] = [33, 150, 243]; // Azul
    const dangerColor: [number, number, number] = [244, 67, 54]; // Rojo
    const grayColor: [number, number, number] = [158, 158, 158]; // Gris

    // Función helper para agregar nueva página si es necesario
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Función helper para agregar título de sección
    const addSectionTitle = (title: string, color: [number, number, number] = primaryColor) => {
      checkPageBreak(10);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, yPos + 5.5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    };


    // Portada
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Estadísticas de Inventario', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = format(new Date(), 'dd \'de\' MMMM \'de\' yyyy, HH:mm', { locale: es });
    doc.text(`Generado el ${fechaGeneracion}`, pageWidth / 2, 32, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Información de filtros aplicados
    if (filters && (filters.espacioNombre || filters.tipoElementoNombre || filters.estado !== 'todos')) {
      checkPageBreak(15);
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros Aplicados:', margin + 2, yPos + 5);
      doc.setFont('helvetica', 'normal');
      let filterText = '';
      if (filters.espacioNombre) filterText += `Espacio: ${filters.espacioNombre} | `;
      if (filters.tipoElementoNombre) filterText += `Tipo: ${filters.tipoElementoNombre} | `;
      if (filters.estado && filters.estado !== 'todos') filterText += `Estado: ${filters.estado}`;
      doc.text(filterText.replace(/\s*\|\s*$/, ''), margin + 2, yPos + 10);
      yPos += 18;
    }

    // === RESUMEN EJECUTIVO ===
    addSectionTitle('RESUMEN EJECUTIVO', primaryColor);
    
    checkPageBreak(30);
    const summaryData = [
      ['Total Items', stats.totalItems.toString(), stats.totalCantidad.toString() + ' unidades'],
      ['Disponibles', stats.disponibles.toString(), stats.porcentajeDisponibles.toFixed(1) + '%'],
      ['En Mantenimiento', stats.mantenimiento.toString(), stats.porcentajeMantenimiento.toFixed(1) + '%'],
      ['Dañados', stats.danados.toString(), stats.porcentajeDanados.toFixed(1) + '%'],
      ['Asignados', stats.asignados.toString(), stats.porcentajeAsignados.toFixed(1) + '%'],
      ['Sin Asignar', stats.sinAsignar.toString(), stats.porcentajeSinAsignar.toFixed(1) + '%'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Cantidad', 'Porcentaje']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // Métricas de salud
    checkPageBreak(15);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores de Salud:', margin + 2, yPos + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ratio de Salud: ${stats.ratioSalud.toFixed(1)}% | Ratio de Problemas: ${stats.ratioProblemas.toFixed(1)}% | Cobertura: ${stats.indiceCobertura.toFixed(1)}%`, margin + 2, yPos + 8);
    yPos += 15;

    // === ESTADÍSTICAS TEMPORALES ===
    const temporalColor: [number, number, number] = [76, 175, 80];
    addSectionTitle('ANALISIS TEMPORAL', temporalColor);

    checkPageBreak(25);
    const temporalData = [
      ['Creados Este Mes', stats.itemsCreadosEsteMes.toString(), formatMesAnterior(stats.diferenciaMesAnterior, stats.porcentajeCambioMesAnterior)],
      ['Creados Este Año', stats.itemsCreadosEsteAnio.toString(), `Últimos 6 meses: ${stats.itemsCreadosUltimos6Meses}`],
      ['Actualizados Este Mes', stats.itemsActualizadosEsteMes.toString(), `Últimos 7 días: ${stats.itemsActualizadosUltimos7Dias}`],
      ['Antigüedad Promedio', Math.round(stats.promedioAntiguedadDias).toString() + ' días', `${Math.round(stats.promedioTiempoSinActualizarDias)} días sin actualizar`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Período', 'Cantidad', 'Detalles']],
      body: temporalData,
      theme: 'striped',
      headStyles: { fillColor: temporalColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === TOP RANKINGS ===
    const topRankingsColor: [number, number, number] = [255, 152, 0];
    addSectionTitle('TOP RANKINGS', topRankingsColor);

    // Top 10 Espacios
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Espacios con Más Inventario', margin, yPos);
    yPos += 5;

    const topEspaciosData = stats.topEspacios.map((espacio, index) => [
      `#${index + 1}`,
      espacio.espacioNombre,
      espacio.items.toString(),
      espacio.cantidad.toString() + ' unidades'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Espacio', 'Items', 'Cantidad Total']],
      body: topEspaciosData,
      theme: 'striped',
      headStyles: { fillColor: topRankingsColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // Top 10 Tipos
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Tipos de Elemento', margin, yPos);
    yPos += 5;

    const topTiposData = stats.topTipos.map((tipo, index) => [
      `#${index + 1}`,
      tipo.tipoNombre,
      tipo.items.toString(),
      tipo.cantidad.toString() + ' unidades'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Tipo de Elemento', 'Items', 'Cantidad Total']],
      body: topTiposData,
      theme: 'striped',
      headStyles: { fillColor: topRankingsColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === ITEMS CRÍTICOS ===
    if (stats.itemsCriticos > 0 || stats.espaciosSinInventario > 0) {
      addSectionTitle('ITEMS CRITICOS Y ALERTAS', dangerColor);

      checkPageBreak(20);
      const criticalData = [
        ['Items Críticos Totales', stats.itemsCriticos.toString()],
        ['Sin Asignar + Problemas', stats.itemsSinAsignarConProblemas.toString()],
        ['Espacios Sin Inventario', stats.espaciosSinInventario.toString()],
        ['Tipos Sin Items', stats.tiposSinItems.toString()],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Alerta', 'Cantidad']],
        body: criticalData,
        theme: 'striped',
        headStyles: { fillColor: dangerColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

      // Espacios con más problemas
      if (stats.espaciosConMasProblemas.length > 0) {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Espacios con Más Problemas', margin, yPos);
        yPos += 5;

        const problemasEspaciosData = stats.espaciosConMasProblemas.map((espacio) => [
          espacio.espacioNombre,
          espacio.problemas.toString(),
          espacio.porcentaje.toFixed(1) + '%'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Espacio', 'Problemas', '% del Inventario']],
          body: problemasEspaciosData,
          theme: 'striped',
          headStyles: { fillColor: dangerColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: margin, right: margin },
        });
        yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
      }
    }

    // === ANÁLISIS DE DISTRIBUCIÓN ===
    const distribucionColor: [number, number, number] = [156, 39, 176];
    addSectionTitle('ANALISIS DE DISTRIBUCION', distribucionColor);

    checkPageBreak(40);
    const distribucionData = [
      ['Items por Espacio (Promedio)', stats.promedioItemsPorEspacio.toFixed(1)],
      ['Cantidad por Item (Promedio)', stats.promedioCantidadPorItem.toFixed(1)],
      ['Items por Tipo (Promedio)', stats.promedioItemsPorTipo.toFixed(1)],
      ['Cantidad por Espacio (Promedio)', stats.promedioCantidadPorEspacio.toFixed(1)],
      ['Cantidad por Tipo (Promedio)', stats.promedioCantidadPorTipo.toFixed(1)],
      ['Densidad de Inventario', stats.densidadInventario.toFixed(1) + ' items/espacio'],
      ['Eficiencia de Asignación', stats.eficienciaAsignacion.toFixed(1) + '%'],
      ['Concentración de Inventario', stats.concentracionInventario.toFixed(1) + '%'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: distribucionData,
      theme: 'striped',
      headStyles: { fillColor: distribucionColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // Distribución por cantidad
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Distribución por Cantidad', margin, yPos);
    yPos += 5;

    const cantidadData = [
      ['Cantidad 1', stats.itemsConCantidad1.toString()],
      ['Cantidad Media (2-10)', stats.itemsConCantidadMedia.toString()],
      ['Cantidad Alta (>10)', stats.itemsConCantidadAlta.toString()],
      ['Rango', `${stats.cantidadMinima} - ${stats.cantidadMaxima}`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Rango', 'Items']],
      body: cantidadData,
      theme: 'striped',
      headStyles: { fillColor: distribucionColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === INVENTARIO COMPLETO POR TIPO ===
    if (stats.itemsPorTipo.length > 0) {
      const tipoColor: [number, number, number] = [0, 150, 136];
      addSectionTitle('INVENTARIO COMPLETO POR TIPO', tipoColor);

      checkPageBreak(50);
      const tipoCompletoData = stats.itemsPorTipo.map((tipo) => {
        const porcentaje = stats.totalItems > 0 ? (tipo.items / stats.totalItems) * 100 : 0;
        return [
          tipo.tipoNombre,
          tipo.items.toString(),
          tipo.cantidad.toString(),
          tipo.disponibles.toString(),
          tipo.mantenimiento.toString(),
          tipo.danados.toString(),
          porcentaje.toFixed(1) + '%'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Items', 'Cantidad', 'Disponibles', 'Mantenimiento', 'Dañados', '% del Total']],
        body: tipoCompletoData,
        theme: 'striped',
        headStyles: { fillColor: tipoColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
        },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    }

    // === INVENTARIO COMPLETO POR ESPACIO ===
    if (stats.itemsPorEspacio.length > 0) {
      const espacioColor: [number, number, number] = [103, 58, 183];
      addSectionTitle('INVENTARIO COMPLETO POR ESPACIO', espacioColor);

      checkPageBreak(50);
      const espacioCompletoData = stats.itemsPorEspacio.map((espacio) => [
        espacio.espacioNombre,
        espacio.items.toString(),
        espacio.cantidad.toString(),
        espacio.disponibles.toString(),
        espacio.mantenimiento.toString(),
        espacio.danados.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Espacio', 'Items', 'Cantidad', 'Disponibles', 'Mantenimiento', 'Dañados']],
        body: espacioCompletoData,
        theme: 'striped',
        headStyles: { fillColor: espacioColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 },
        },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    }

    // Pie de página en todas las páginas
    addFooter(doc, pageWidth, pageHeight, grayColor);

    // Generar nombre de archivo
    const fecha = format(new Date(), 'yyyy-MM-dd');
    const nombreArchivo = `estadisticas_inventario_${fecha}.pdf`;

    // Descargar PDF
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}

interface ReservaStats {
  totalReservas: number;
  totalAprobadas: number;
  totalPendientes: number;
  totalCanceladas: number;
  totalFuturas: number;
  totalPasadas: number;
  totalActivas: number;
  reservasPorEstado: Record<string, number>;
  reservasEsteMes: number;
  reservasProximoMes: number;
  reservasEsteAnio: number;
  reservasPorMes: Record<string, number>;
  reservasPorDiaSemana: Record<string, number>;
  mesConMasReservas?: string | null;
  promedioReservasPorMes: number;
  totalEspaciosUsados: number;
  espacioMasUsado?: number | null;
  nombreEspacioMasUsado?: string | null;
  reservasPorEspacio: Record<string, number>;
  distribucionPorEspacio: Record<string, number>;
  duracionTotalHoras: number;
  duracionPromedioHoras: number;
  reservaMasLargaHoras: number;
  reservaMasCortaHoras: number;
  horasReservadasEsteMes: number;
  promedioReservasPorSemana: number;
  diasDesdeUltimaReserva?: number | null;
  diasHastaProximaReserva?: number | null;
  fechaUltimaReserva?: string | null;
  fechaProximaReserva?: string | null;
  reservasMesActual: number;
  reservasMesAnterior: number;
  diferenciaMesAnterior: number;
  porcentajeCambioMesAnterior: number;
}

interface ReservationExportFilters {
  espacioNombre?: string;
  carreraNombre?: string;
}

/**
 * Exporta las estadísticas de reservas a PDF con un diseño profesional
 */
export function exportReservationStatsToPDF(
  stats: ReservaStats,
  filters?: ReservationExportFilters
): void {
  try {
    const doc = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Colores personalizados
    const primaryColor: [number, number, number] = [33, 150, 243]; // Azul
    const successColor: [number, number, number] = [76, 175, 80]; // Verde
    const warningColor: [number, number, number] = [255, 152, 0]; // Naranja
    const grayColor: [number, number, number] = [158, 158, 158]; // Gris

    // Función helper para agregar nueva página si es necesario
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Función helper para agregar título de sección
    const addSectionTitle = (title: string, color: [number, number, number] = primaryColor) => {
      checkPageBreak(10);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, yPos + 5.5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    };

    // Portada
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Estadísticas de Reservas', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = format(new Date(), 'dd \'de\' MMMM \'de\' yyyy, HH:mm', { locale: es });
    doc.text(`Generado el ${fechaGeneracion}`, pageWidth / 2, 32, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Información de filtros aplicados
    if (filters && (filters.espacioNombre || filters.carreraNombre)) {
      checkPageBreak(15);
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros Aplicados:', margin + 2, yPos + 5);
      doc.setFont('helvetica', 'normal');
      let filterText = '';
      if (filters.espacioNombre) filterText += `Espacio: ${filters.espacioNombre} | `;
      if (filters.carreraNombre) filterText += `Carrera: ${filters.carreraNombre}`;
      doc.text(filterText.replace(/\s*\|\s*$/, ''), margin + 2, yPos + 10);
      yPos += 18;
    }

    // === RESUMEN EJECUTIVO ===
    addSectionTitle('RESUMEN EJECUTIVO', primaryColor);
    
    checkPageBreak(40);
    const porcentajeAprobadas = stats.totalReservas > 0 
      ? ((stats.totalAprobadas / stats.totalReservas) * 100).toFixed(1)
      : '0';
    const porcentajePendientes = stats.totalReservas > 0 
      ? ((stats.totalPendientes / stats.totalReservas) * 100).toFixed(1)
      : '0';
    const porcentajeCanceladas = stats.totalReservas > 0 
      ? ((stats.totalCanceladas / stats.totalReservas) * 100).toFixed(1)
      : '0';

    const summaryData = [
      ['Total Reservas', stats.totalReservas.toString()],
      ['Aprobadas', `${stats.totalAprobadas} (${porcentajeAprobadas}%)`],
      ['Pendientes', `${stats.totalPendientes} (${porcentajePendientes}%)`],
      ['Canceladas', `${stats.totalCanceladas} (${porcentajeCanceladas}%)`],
      ['Futuras', stats.totalFuturas.toString()],
      ['Pasadas', stats.totalPasadas.toString()],
      ['Activas', stats.totalActivas.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === ESTADÍSTICAS TEMPORALES ===
    addSectionTitle('ANALISIS TEMPORAL', successColor);

    checkPageBreak(30);
    const formatHours = (hours: number) => {
      if (hours < 1) return `${Math.round(hours * 60)} min`;
      if (hours === Math.floor(hours)) return `${Math.floor(hours)}h`;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}h ${m}min`;
    };

    const temporalData = [
      ['Reservas Este Mes', stats.reservasEsteMes.toString(), `Cambio: ${stats.diferenciaMesAnterior > 0 ? '+' : ''}${stats.diferenciaMesAnterior} (${stats.porcentajeCambioMesAnterior > 0 ? '+' : ''}${stats.porcentajeCambioMesAnterior.toFixed(1)}%)`],
      ['Reservas Próximo Mes', stats.reservasProximoMes.toString(), 'Reservas programadas'],
      ['Reservas Este Año', stats.reservasEsteAnio.toString(), `Promedio: ${stats.promedioReservasPorMes.toFixed(1)}/mes`],
      ['Promedio Semanal', stats.promedioReservasPorSemana.toFixed(1), `${stats.promedioReservasPorMes.toFixed(1)} por mes`],
      ['Mes con Más Reservas', stats.mesConMasReservas || 'N/A', ''],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Período', 'Cantidad', 'Detalles']],
      body: temporalData,
      theme: 'striped',
      headStyles: { fillColor: successColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === ANÁLISIS DE DURACIÓN ===
    addSectionTitle('ANALISIS DE DURACION', warningColor);

    checkPageBreak(25);
    const duracionData = [
      ['Duración Total', formatHours(stats.duracionTotalHoras)],
      ['Duración Promedio', formatHours(stats.duracionPromedioHoras)],
      ['Reserva Más Larga', formatHours(stats.reservaMasLargaHoras)],
      ['Reserva Más Corta', formatHours(stats.reservaMasCortaHoras)],
      ['Horas Este Mes', formatHours(stats.horasReservadasEsteMes)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: duracionData,
      theme: 'striped',
      headStyles: { fillColor: warningColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // === ANÁLISIS DE ESPACIOS ===
    addSectionTitle('ANALISIS DE ESPACIOS', primaryColor);

    checkPageBreak(20);
    const espaciosData = [
      ['Total Espacios Usados', stats.totalEspaciosUsados.toString()],
      ['Espacio Más Usado', stats.nombreEspacioMasUsado || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: espaciosData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

    // Top 10 Espacios
    if (stats.reservasPorEspacio && Object.keys(stats.reservasPorEspacio).length > 0) {
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Espacios Más Reservados', margin, yPos);
      yPos += 5;

      const sortedEspacios = Object.entries(stats.reservasPorEspacio)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const topEspaciosData = sortedEspacios.map(([espacioId, cantidad], index) => [
        `#${index + 1}`,
        `Espacio ${espacioId}`,
        cantidad.toString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Espacio', 'Reservas']],
        body: topEspaciosData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    }

    // === RESERVAS POR MES ===
    if (stats.reservasPorMes && Object.keys(stats.reservasPorMes).length > 0) {
      addSectionTitle('RESERVAS POR MES', successColor);

      checkPageBreak(40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribución Mensual', margin, yPos);
      yPos += 5;

      const reservasPorMesData = Object.entries(stats.reservasPorMes)
        .map(([mes, cantidad]) => [mes, cantidad.toString()])
        .sort(([a], [b]) => a.localeCompare(b));

      autoTable(doc, {
        startY: yPos,
        head: [['Mes', 'Cantidad']],
        body: reservasPorMesData,
        theme: 'striped',
        headStyles: { fillColor: successColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    }

    // === RESERVAS POR DÍA DE SEMANA ===
    if (stats.reservasPorDiaSemana && Object.keys(stats.reservasPorDiaSemana).length > 0) {
      addSectionTitle('RESERVAS POR DIA DE SEMANA', warningColor);

      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribución por Día de Semana', margin, yPos);
      yPos += 5;

      const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const reservasPorDiaData = Object.entries(stats.reservasPorDiaSemana)
        .map(([dia, cantidad]) => ({
          dia,
          cantidad,
          orden: diasOrden.indexOf(dia) === -1 ? 99 : diasOrden.indexOf(dia)
        }))
        .sort((a, b) => a.orden - b.orden)
        .map(({ dia, cantidad }) => [dia, cantidad.toString()]);

      autoTable(doc, {
        startY: yPos,
        head: [['Día', 'Cantidad']],
        body: reservasPorDiaData,
        theme: 'striped',
        headStyles: { fillColor: warningColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });
      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
    }

    // === INFORMACIÓN ADICIONAL ===
    if (stats.fechaUltimaReserva || stats.fechaProximaReserva) {
      addSectionTitle('INFORMACION ADICIONAL', grayColor);

      checkPageBreak(20);
      const infoData: string[][] = [];
      if (stats.fechaUltimaReserva) {
        const fechaUltima = format(new Date(stats.fechaUltimaReserva), 'dd MMM yyyy, HH:mm', { locale: es });
        infoData.push(['Última Reserva', fechaUltima]);
        if (stats.diasDesdeUltimaReserva !== null) {
          infoData.push(['Días desde Última', `${stats.diasDesdeUltimaReserva} días`]);
        }
      }
      if (stats.fechaProximaReserva) {
        const fechaProxima = format(new Date(stats.fechaProximaReserva), 'dd MMM yyyy, HH:mm', { locale: es });
        infoData.push(['Próxima Reserva', fechaProxima]);
        if (stats.diasHastaProximaReserva !== null) {
          infoData.push(['Días hasta Próxima', `${stats.diasHastaProximaReserva} días`]);
        }
      }

      if (infoData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Información', 'Valor']],
          body: infoData,
          theme: 'striped',
          headStyles: { fillColor: grayColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: margin, right: margin },
        });
        yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
      }
    }

    // Pie de página en todas las páginas
    addFooter(doc, pageWidth, pageHeight, grayColor);

    // Generar nombre de archivo
    const fecha = format(new Date(), 'yyyy-MM-dd');
    const nombreArchivo = `estadisticas_reservas_${fecha}.pdf`;

    // Descargar PDF
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Intenta nuevamente.');
  }
}


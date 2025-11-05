import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

/**
 * Exporta las estadísticas de inventario a PDF con un diseño profesional
 */
export function exportInventoryStatsToPDF(
  stats: InventoryStats,
  filters?: ExportFilters
): void {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
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
    yPos = (doc as any).lastAutoTable.finalY + 8;

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
    addSectionTitle('ANALISIS TEMPORAL', [76, 175, 80] as [number, number, number]);

    checkPageBreak(25);
    const temporalData = [
      ['Creados Este Mes', stats.itemsCreadosEsteMes.toString(), stats.diferenciaMesAnterior !== 0 ? `${stats.diferenciaMesAnterior > 0 ? '+' : ''}${stats.diferenciaMesAnterior} (${stats.porcentajeCambioMesAnterior > 0 ? '+' : ''}${stats.porcentajeCambioMesAnterior.toFixed(1)}%)` : '-'],
      ['Creados Este Año', stats.itemsCreadosEsteAnio.toString(), `Últimos 6 meses: ${stats.itemsCreadosUltimos6Meses}`],
      ['Actualizados Este Mes', stats.itemsActualizadosEsteMes.toString(), `Últimos 7 días: ${stats.itemsActualizadosUltimos7Dias}`],
      ['Antigüedad Promedio', Math.round(stats.promedioAntiguedadDias).toString() + ' días', `${Math.round(stats.promedioTiempoSinActualizarDias)} días sin actualizar`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Período', 'Cantidad', 'Detalles']],
      body: temporalData,
      theme: 'striped',
      headStyles: { fillColor: [76, 175, 80] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

    // === TOP RANKINGS ===
    addSectionTitle('TOP RANKINGS', [255, 152, 0] as [number, number, number]);

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
      headStyles: { fillColor: [255, 152, 0] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

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
      headStyles: { fillColor: [255, 152, 0] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

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
      yPos = (doc as any).lastAutoTable.finalY + 8;

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
        yPos = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    // === ANÁLISIS DE DISTRIBUCIÓN ===
    addSectionTitle('ANALISIS DE DISTRIBUCION', [156, 39, 176] as [number, number, number]);

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
      headStyles: { fillColor: [156, 39, 176] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

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
      headStyles: { fillColor: [156, 39, 176] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;

    // === INVENTARIO COMPLETO POR TIPO ===
    if (stats.itemsPorTipo.length > 0) {
      addSectionTitle('INVENTARIO COMPLETO POR TIPO', [0, 150, 136] as [number, number, number]);

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
        headStyles: { fillColor: [0, 150, 136] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
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
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // === INVENTARIO COMPLETO POR ESPACIO ===
    if (stats.itemsPorEspacio.length > 0) {
      addSectionTitle('INVENTARIO COMPLETO POR ESPACIO', [103, 58, 183] as [number, number, number]);

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
        headStyles: { fillColor: [103, 58, 183] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
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
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Pie de página en todas las páginas
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


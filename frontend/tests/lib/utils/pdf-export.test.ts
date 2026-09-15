import { describe, it, expect, vi } from 'vitest';
import type { EstadoInventario, ResumenReservas } from '@/lib/api/stats';

const guardar = vi.hoisted(() => vi.fn());

// jsPDF define save en cada instancia, así que se reemplaza al construirla:
// el resto del documento (tablas incluidas) se arma de verdad.
vi.mock('jspdf', async (importOriginal) => {
  const real = await importOriginal<typeof import('jspdf')>();
  function Documento(...args: ConstructorParameters<typeof real.default>) {
    const doc = new real.default(...args);
    doc.save = guardar;
    return doc;
  }
  return { ...real, default: Documento };
});

import { exportInventarioToPDF, exportReservasToPDF } from '@/lib/utils/pdf-export';

const totales = { total: 10, aprobadas: 7, pendientes: 2, pendientesVencidas: 1, canceladas: 1, horasAprobadas: 12, duracionPromedioHoras: 1.5, anticipacionPromedioDias: 4, espaciosUsados: 3, usuarios: 5 };

describe('exportación a PDF', () => {
  it('reservas: arma el documento con el período en el nombre', () => {
    const resumen: ResumenReservas = {
      desde: '2026-08-16', hasta: '2026-09-14', actual: totales, anterior: totales, espaciosTotal: 4,
      granularidad: 'dia', serie: [{ periodo: '2026-08-16', aprobadas: 1, pendientes: 0, canceladas: 0 }], diario: [], porRol: [],
    };
    exportReservasToPDF({
      periodoTexto: 'últimos 30 días',
      resumen,
      ocupacion: [{ espacioId: 1, espacioNombre: 'Aula', edificioNombre: 'A', horasReservadas: 10, horasDisponibles: 406, reservas: 5, porcentaje: 2.5 }],
      edificios: [{ edificioId: 1, edificioNombre: 'A', cantReservas: 5 }],
      carreras: [{ carreraId: 1, carreraNombre: 'Ing.', aprobadas: 3, canceladas: 1, pendientes: 0, canceladasTarde: 0, tasaCancelacion: 25 }],
      usuarios: [{ usuarioId: 1, nombre: 'Ana', email: 'a@b', rol: 'DOCENTE', cantReservas: 4, aprobadas: 3, canceladas: 1 }],
    });
    expect(guardar).toHaveBeenLastCalledWith('estadisticas_reservas_2026-08-16_2026-09-14.pdf');
  });

  it('inventario: arma el documento con atención, grupos y antigüedad', () => {
    const estado: EstadoInventario = {
      totales: { items: 2, unidades: 3, disponibles: 1, mantenimiento: 1, danados: 0, sinEspacio: 0 },
      cobertura: null,
      porTipo: [{ id: 1, nombre: 'Silla', detalle: null, items: 2, unidades: 3, disponibles: 1, mantenimiento: 1, danados: 0 }],
      porEspacio: [{ id: 1, nombre: 'Aula', detalle: 'A', items: 2, unidades: 3, disponibles: 1, mantenimiento: 1, danados: 0 }],
      matriz: [],
      atencion: [{ id: 1, tipo: 'Silla', espacio: 'Aula', estado: 'MANTENIMIENTO', cantidad: 1, diasSinCambios: 3, observaciones: null }],
      antiguedad: { menosDe30Dias: 1, de30a90Dias: 1, de90DiasAUnAnio: 0, masDeUnAnio: 0, sinCambiosHace6Meses: 0 },
      opciones: { edificios: [], espacios: [], tipos: [] },
    };
    exportInventarioToPDF({ estado, filtrosTexto: 'Espacio: Aula' });
    expect(guardar).toHaveBeenLastCalledWith(expect.stringMatching(/^estadisticas_inventario_\d{4}-\d{2}-\d{2}\.pdf$/));
  });
});

import type { Academico, Aprobacion, DemandaInventario, EspaciosReservas, ExternosReservas, Novedad, OpcionesReservas, ResumenReservas } from '@/lib/api/stats';

export const RANGO = { desde: '2026-08-16', hasta: '2026-09-14' };

export const resumen: ResumenReservas = {
  desde: '2026-08-16',
  hasta: '2026-09-14',
  desdeAnterior: '2026-07-17',
  hastaAnterior: '2026-08-15',
  comparacion: 'anterior',
  actual: { total: 200, aprobadas: 150, pendientes: 30, pendientesVencidas: 12, canceladas: 20, horasAprobadas: 180, duracionPromedioHoras: 1.2, anticipacionPromedioDias: 8.4, espaciosUsados: 9, usuarios: 40 },
  anterior: { total: 160, aprobadas: 120, pendientes: 25, pendientesVencidas: 5, canceladas: 15, horasAprobadas: 140, duracionPromedioHoras: 1.1, anticipacionPromedioDias: 7, espaciosUsados: 8, usuarios: 35 },
  espaciosTotal: 14,
  granularidad: 'dia',
  serie: [{ periodo: '2026-08-16', aprobadas: 5, pendientes: 1, canceladas: 0 }],
  diario: [{ periodo: '2026-08-16', aprobadas: 5, pendientes: 1, canceladas: 0 }],
  porRol: [{ nombre: 'DOCENTE', total: 120, aprobadas: 100 }, { nombre: 'EXTERNO', total: 80, aprobadas: 50 }],
};

export const opciones: OpcionesReservas = {
  edificios: [{ id: 1, nombre: 'Edificio A' }],
  espacios: [
    { id: 1, nombre: 'Aula 11', edificioId: 1, tipoEspacioId: 2 },
    { id: 2, nombre: 'Sala vacía', edificioId: 1, tipoEspacioId: 2 },
  ],
  tiposEspacio: [{ id: 2, nombre: 'Aula' }],
  roles: ['DOCENTE', 'EXTERNO'],
  carreras: [{ id: 3, nombre: 'Ingeniería' }],
};

export const novedades: Novedad[] = [
  { tipo: 'espacio', clave: '1', titulo: 'Aula 11', metrica: 'ocupacion', antes: 20, ahora: 60, cambio: 40, unidad: 'pp', sentido: 'sube', bueno: null },
  { tipo: 'carrera', clave: '3', titulo: 'Ingeniería', metrica: 'cancelacion', antes: 10, ahora: 28, cambio: 18, unidad: 'pp', sentido: 'sube', bueno: false },
  { tipo: 'rol', clave: 'EXTERNO', titulo: 'EXTERNO', metrica: 'reservas', antes: 40, ahora: 80, cambio: 100, unidad: '%', sentido: 'sube', bueno: null },
  { tipo: 'aprobacion', clave: null, titulo: 'Tiempo de respuesta', metrica: 'respuesta', antes: 30, ahora: 6, cambio: -24, unidad: 'h', sentido: 'baja', bueno: true },
];

export const aprobacion: Aprobacion = {
  respuesta: { resueltas: 170, conDato: 150, medianaHoras: 5.2, p90Horas: 40.1, dentroDe24hPct: 78.5 },
  distribucionRespuesta: [
    { tramo: '< 1 h', cantidad: 30 },
    { tramo: '1–4 h', cantidad: 40 },
    { tramo: '4–24 h', cantidad: 50 },
    { tramo: '1–3 días', cantidad: 20 },
    { tramo: '> 3 días', cantidad: 10 },
  ],
  analistas: [{ usuarioId: 7, nombre: 'Ana Analista', asignadas: 120, pendientes: 20, vencidas: 5, aprobadas: 90, canceladas: 10, medianaHoras: 4 }],
  antelacion: [
    { tramo: 'Mismo día', total: 50, aprobadas: 30, canceladas: 10, pendientes: 10 },
    { tramo: 'Más de 30 días', total: 20, aprobadas: 18, canceladas: 1, pendientes: 1 },
  ],
  pendientesPorAntiguedad: [
    { tramo: '< 24 h', cantidad: 10, vencidas: 0 },
    { tramo: '> 7 días', cantidad: 8, vencidas: 6 },
  ],
};

export const espacios: EspaciosReservas = {
  espacios: [
    { espacioId: 1, nombre: 'Aula 11', edificioNombre: 'Edificio A', tipoEspacio: 'Aula', capacidad: 40, horas: 40, reservas: 30, ocupacionPct: 9.5, cupoPromedio: 12, usoCapacidadPct: 30 },
  ],
  saturacion: [
    { tipoEspacio: 'Laboratorio', espacios: 3, hora: 10, ocupacionPct: 80, horasLlenas: 4 },
    { tipoEspacio: 'Aula', espacios: 9, hora: 10, ocupacionPct: 30, horasLlenas: 0 },
  ],
  capacidad: [
    { tipo: 'EVENTO', id: 5, titulo: 'Charla desbordada', fecha: '2026-09-01', espacioNombre: 'Aula 11', capacidad: 40, cupo: 60, inscriptos: 55, usoPct: 137.5 },
    { tipo: 'TUTORIA', id: 6, titulo: 'Tutoría Cálculo', fecha: '2026-09-02', espacioNombre: 'Aula 11', capacidad: 40, cupo: 6, inscriptos: 5, usoPct: 12.5 },
  ],
};

export const equipos: DemandaInventario = {
  totales: { solicitudes: 100, unidades: 200, pendientes: 70, aprobadas: 8, entregadas: 12, rechazadas: 10 },
  porTipo: [
    { tipoElementoId: 2, nombre: 'Proyector', solicitudes: 30, unidades: 60, pendientes: 20, aprobadas: 3, entregadas: 5, rechazadas: 2, disponibles: 10, enInventario: 14, maxUnidadesDia: 25 },
    { tipoElementoId: 3, nombre: 'Parlante', solicitudes: 5, unidades: 5, pendientes: 1, aprobadas: 1, entregadas: 2, rechazadas: 1, disponibles: 8, enInventario: 8, maxUnidadesDia: 2 },
  ],
  espaciosConProblemas: [{ espacioId: 1, nombre: 'Aula 11', reservas: 40, itemsConProblema: 2 }],
};

export const academico: Academico = {
  tutorias: { total: 100, presenciales: 60, virtuales: 40, grupales: 50, individuales: 50, cupoTotal: 600, agendadas: 500, asistieron: 300, ocupacionCupoPct: 83.3, asistenciaPct: 60, ratingPromedio: 4.2, feedbacks: 150 },
  porMateria: [{ materiaId: 1, nombre: 'Cálculo I', carreraNombre: 'Ingeniería', tutorias: 10, agendadas: 50, asistieron: 30, ratingPromedio: 4.5 }],
  porSemana: [{ semana: '2026-08-31', tutorias: 8, agendadas: 40, asistieron: 25 }],
  eventos: { total: 10, inscripciones: 200, cupoTotal: 300, ratingPromedio: 4 },
  eventosLista: [
    { id: 1, titulo: 'Charla de robótica', tipo: 'EVENTO', fecha: '2026-09-01', espacioNombre: 'Anfiteatro', cupo: 100, inscriptos: 80, ratingPromedio: 4.3 },
    { id: 2, titulo: 'Taller lleno', tipo: 'TALLER', fecha: '2026-09-02', espacioNombre: 'Aula 11', cupo: 20, inscriptos: 22, ratingPromedio: null },
  ],
};

export const externos: ExternosReservas = {
  total: 5,
  organizadores: [{ organizador: 'ACME', eventos: 5, aprobadas: 4, canceladas: 1, horas: 12, espacios: 2 }],
};

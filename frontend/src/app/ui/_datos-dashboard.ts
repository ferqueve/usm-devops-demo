import type { DashboardData } from '@/lib/api/dashboard';
import type { Reserva, ReservaStats } from '@/lib/types/spaces';
import { MARCA } from '@/lib/design/paleta';

/**
 * Un `DashboardData` completo, con su tipo de verdad.
 *
 * Los seis dashboards por rol reciben todos este mismo objeto y cada uno saca
 * lo suyo, así que armarlo una vez los monta a los seis. Va tipado y no con
 * `as never`: son pantallas que desarman el dato campo por campo y un nombre
 * inventado rompe en el navegador en vez de en el compilador.
 *
 * Los números imitan un campus con trabajo atrasado —cola de pendientes,
 * inventario esperando, dos servicios caídos— porque el estado vacío no
 * muestra nada de lo que hay que poder revisar.
 */

const BASE = '2026-09-17T';

function reserva(
  id: number,
  titulo: string,
  hora: string,
  espacio: string,
  extra: Partial<Reserva> = {}
): Reserva {
  return {
    id,
    espacioId: 8,
    espacioNombre: espacio,
    capacidadEspacio: 30,
    tipoEspacioId: 1,
    tipoEspacioNombre: 'Aula teórica',
    tipoEspacioColor: MARCA.azul,
    titulo,
    usuarioId: 15,
    usuarioNombre: 'Docente Quince',
    usuarioEmail: 'docente15@utec.edu.uy',
    carreraId: 3,
    carreraNombre: 'Licenciatura en Tecnologías de la Información',
    carreraCodigo: 'LTI',
    inicio: `${BASE}${hora}:00`,
    fin: `${BASE}${hora.replace(/^(\d+)/, (h) => String(Number(h) + 1).padStart(2, '0'))}:00`,
    estado: 'APROBADO',
    createdAt: '2026-09-10T09:00:00',
    updatedAt: '2026-09-15T11:20:00',
    ...extra,
  };
}

const PROXIMAS: Reserva[] = [
  reserva(1, 'Clase de Proyecto Integrador', '20:30', 'Laboratorio Mecatrónica', {
    tipoEspacioNombre: 'Laboratorio', tipoEspacioColor: MARCA.verde, capacidadEspacio: 25,
  }),
  reserva(2, 'Charla invitada', '20:00', 'Aula 8'),
  reserva(3, 'Tutoría de Cálculo I', '18:30', 'Aula 9', { capacidadEspacio: 20 }),
  reserva(4, 'Clase de Ética', '18:30', 'Aula 13'),
  reserva(5, 'Taller práctico', '18:30', 'Sala de Lactancia', { capacidadEspacio: 5 }),
  reserva(6, 'Capacitación docente', '18:30', 'Anfiteatro', {
    tipoEspacioNombre: 'Anfiteatro', tipoEspacioColor: MARCA.naranja, capacidadEspacio: 100,
  }),
  reserva(7, 'Defensa de tesis', '18:30', 'Aula teórica 3'),
  reserva(8, 'Hackathon de Datos', '18:00', 'Laboratorio Mecatrónica', {
    tipoEspacioNombre: 'Laboratorio', tipoEspacioColor: MARCA.verde, capacidadEspacio: 25,
  }),
  reserva(9, 'Reunión de equipo', '17:30', 'Aula 7'),
  reserva(10, 'Clase de Redes', '17:00', 'Aula 11'),
];

const PENDIENTES: Reserva[] = [
  reserva(21, 'Simulacro de parcial', '19:00', 'Aula 11', { estado: 'PENDIENTE' }),
  reserva(22, 'Ensayo de coro', '20:00', 'Anfiteatro', {
    estado: 'PENDIENTE', tipoEspacioNombre: 'Anfiteatro', tipoEspacioColor: MARCA.naranja, capacidadEspacio: 100,
  }),
  reserva(23, 'Taller de impresión 3D', '14:00', 'Laboratorio Mecatrónica', {
    estado: 'PENDIENTE', tipoEspacioNombre: 'Laboratorio', tipoEspacioColor: MARCA.verde, capacidadEspacio: 25,
  }),
  reserva(24, 'Reunión con egresados', '16:00', 'Aula 7', { estado: 'PENDIENTE' }),
  reserva(25, 'Clase de recuperación', '08:00', 'Aula teórica 4', { estado: 'PENDIENTE' }),
  reserva(26, 'Charla de bienvenida', '10:00', 'Aula 8', { estado: 'PENDIENTE' }),
];

const POR_MES: Record<string, number> = {
  '2025-10': 640, '2025-11': 810, '2025-12': 420, '2026-01': 180, '2026-02': 520,
  '2026-03': 980, '2026-04': 1240, '2026-05': 1680, '2026-06': 2100, '2026-07': 2980,
  '2026-08': 3420, '2026-09': 2810,
};

const RESERVA_STATS: ReservaStats = {
  totalReservas: 16795,
  totalAprobadas: 11171,
  totalPendientes: 4678,
  totalCanceladas: 946,
  totalFuturas: 2256,
  totalPasadas: 14539,
  totalActivas: 2241,
  reservasPorEstado: { APROBADO: 11171, PENDIENTE: 4678, CANCELADO: 946 },
  reservasEsteMes: 2810,
  reservasProximoMes: 1420,
  reservasEsteAnio: 16795,
  reservasPorMes: POR_MES,
  reservasPorDiaSemana: { Lunes: 2455, Martes: 2110, Miércoles: 2380, Jueves: 1990, Viernes: 1540, Sábado: 420, Domingo: 95 },
  mesConMasReservas: '2026-08',
  promedioReservasPorMes: 1399,
  totalEspaciosUsados: 13,
  espacioMasUsado: 8,
  nombreEspacioMasUsado: 'Aula 8',
  reservasPorEspacio: { 'Aula 8': 2455, 'Laboratorio Mecatrónica': 1870, Anfiteatro: 1210, 'Aula teórica 4': 940, 'Aula 11': 720 },
  distribucionPorEspacio: { 'Aula teórica': 58, Laboratorio: 24, Anfiteatro: 12, Otros: 6 },
  duracionTotalHoras: 18293.5,
  duracionPromedioHoras: 1.09,
  reservaMasLargaHoras: 8,
  reservaMasCortaHoras: 0.5,
  horasReservadasEsteMes: 3062,
  promedioReservasPorSemana: 322,
  diasDesdeUltimaReserva: 0,
  diasHastaProximaReserva: 0,
  fechaUltimaReserva: '2026-09-17T20:30:00',
  fechaProximaReserva: '2026-09-17T21:00:00',
  reservasMesActual: 2810,
  reservasMesAnterior: 3420,
  diferenciaMesAnterior: -610,
  porcentajeCambioMesAnterior: -18,
};

export const DASHBOARD: DashboardData = {
  stats: {
    totalReservas: 16795,
    reservasHoy: 94,
    reservasPendientes: 4678,
    reservasAprobadas: 11171,
    reservasCanceladas: 946,
    totalEspacios: 13,
    espaciosDisponibles: 13,
    espaciosOcupados: 4,
    espaciosEnMantenimiento: 0,
    capacidadPromedio: 32,
    totalUsuarios: 116,
    usuariosActivos: 6,
    usuariosNuevosHoy: 2,
    promedioReservasPorEspacio: 1292,
    materias: 4,
    creditos: 44,
    inscriptos: 34,
    tutorias: 3,
    racha: 5,
    tutoriasAsistidas: 12,
    resueltasPorMi: 218,
    eventosProximos: 3,
  },
  proximasReservas: PROXIMAS,
  misReservas: PROXIMAS.slice(0, 5),
  reservasPendientes: PENDIENTES,
  reservaStats: RESERVA_STATS,
  userStats: {
    totalUsuarios: 116,
    totalActivos: 116,
    totalInactivos: 0,
    totalVerificados: 116,
    totalNoVerificados: 0,
    usuariosPorRol: {
      ESTUDIANTE: 81, DOCENTE: 16, EXTERNO: 12, ANALISTA: 3, MANTENIMIENTO: 3, ADMIN: 1,
    },
    usuariosPorProveedor: { LOCAL: 115, GOOGLE: 1 },
  },
  // `inventarioStats` se omite a propósito: InventoryStats tiene más de sesenta
  // campos y las pantallas que lo reciben no leen ninguno de forma directa, se
  // lo pasan entero a sus widgets. Armarlo completo sería ruido; los widgets
  // que sí lo desarman reciben su propio dato.
  solicitudesInventarioPendientes: 7458,
  misMaterias: [
    { id: 1, nombre: 'Programación I', codigo: 'PROG1', creditos: 12, inscriptos: 34, semestre: 1 },
    { id: 2, nombre: 'Bases de Datos', codigo: 'BD', creditos: 10, inscriptos: 28, semestre: 3 },
    { id: 3, nombre: 'Introducción al Machine Learning', codigo: 'ML1', creditos: 12, inscriptos: 19, semestre: 5 },
    { id: 4, nombre: 'Estructuras de Datos', codigo: 'ED', creditos: 10, inscriptos: 26, semestre: 2 },
  ],
  misTutorias: [
    { id: 1, materiaId: 2, materiaNombre: 'Cálculo I', inicio: `${BASE}18:30:00`, fin: `${BASE}19:30:00`, espacioNombre: 'Aula 9', docenteNombre: 'Docente Nueve', agendados: 11, cupo: 20 },
    { id: 2, materiaId: 1, materiaNombre: 'Programación I', inicio: '2026-09-19T15:00:00', fin: '2026-09-19T16:00:00', espacioNombre: 'Aula 8', docenteNombre: 'Docente Quince', agendados: 18, cupo: 20 },
    { id: 3, materiaId: 3, materiaNombre: 'Machine Learning', inicio: '2026-09-22T17:00:00', fin: '2026-09-22T18:30:00', espacioNombre: 'Laboratorio Mecatrónica', docenteNombre: 'Docente Tres', agendados: 7, cupo: 25 },
  ],
  eventos: [
    { id: 1, titulo: 'Hackathon de Datos', inicio: '2026-09-20T19:00:00', espacioNombre: 'Anfiteatro', inscriptos: 74, cupo: 100, inscrito: true },
    { id: 2, titulo: 'Charla: Energías Renovables', inicio: '2026-09-22T18:30:00', espacioNombre: 'Aula 8', inscriptos: 30, cupo: 30, inscrito: false },
    { id: 3, titulo: 'Taller de Impresión 3D', inicio: '2026-09-19T14:00:00', espacioNombre: 'Laboratorio Mecatrónica', inscriptos: 12, cupo: 25, inscrito: false },
  ],
  inventarioAtencion: [
    { id: 1, titulo: 'Proyector Epson X41', motivo: 'Lámpara al final de su vida útil', urgencia: 8 },
    { id: 2, titulo: 'Notebook Lenovo T14 · INV-0112', motivo: 'Batería no carga', urgencia: 6 },
    { id: 3, titulo: 'Impresora 3D Prusa MK4', motivo: 'Extrusor obstruido', urgencia: 9 },
  ],
  espaciosFueraDeServicio: [
    { id: 11, nombre: 'Aula 11', estado: 'MANTENIMIENTO', edificio: 'Edificio B' },
  ],
  actividadReciente: [
    { cuando: '2026-09-17T23:04:00', usuario: 'Usuario Admin', accion: 'modificó', entidad: 'Reserva #42' },
    { cuando: '2026-09-17T23:01:00', usuario: 'Usuario Analista', accion: 'aprobó', entidad: 'Reserva #38' },
    { cuando: '2026-09-17T22:58:00', usuario: 'Docente Quince', accion: 'creó', entidad: 'Tutoría #12' },
    { cuando: '2026-09-17T22:41:00', usuario: 'Externo Siete', accion: 'inició sesión', entidad: '' },
    { cuando: '2026-09-17T22:30:00', usuario: 'Mantenimiento Dos', accion: 'cerró', entidad: 'Solicitud #91' },
    { cuando: '2026-09-17T21:40:00', usuario: 'Sistema', accion: 'detectó caída', entidad: 'aiSvc' },
  ],
  salud: {
    estado: 'DOWN',
    componentes: 7,
    caidos: ['aiSvc', 'mlSvc'],
  },
  sostenibilidad: {
    hojasEvitadas: 395334,
    arbolesSalvados: 47,
    co2EvitadoKg: 1982,
  },
  espaciosConPresion: [
    { id: 8, nombre: 'Aula 8', pendientes: 396 },
    { id: 11, nombre: 'Aula 11', pendientes: 201 },
    { id: 3, nombre: 'Laboratorio Mecatrónica', pendientes: 188 },
    { id: 1, nombre: 'Anfiteatro', pendientes: 94 },
  ],
  creditosPorSemestre: [
    { nombre: 'S1', valor: 12 }, { nombre: 'S2', valor: 10 },
    { nombre: 'S3', valor: 10 }, { nombre: 'S4', valor: 12 },
  ],
  inscriptosPorMateria: [
    { nombre: 'Programación I', valor: 34 },
    { nombre: 'Estructuras de Datos', valor: 26 },
    { nombre: 'Bases de Datos', valor: 28 },
    { nombre: 'Machine Learning', valor: 19 },
  ],
};

export const RESERVAS_PROXIMAS = PROXIMAS;
export const RESERVAS_PENDIENTES = PENDIENTES;

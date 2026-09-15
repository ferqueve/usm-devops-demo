import { apiRequest, type ApiResponse } from './client';
import type { ActiveUsersStats } from '../types/system';

export interface TotalesReservas {
  total: number;
  aprobadas: number;
  pendientes: number;
  /** Pendientes cuya fecha ya pasó sin que nadie las resolviera. */
  pendientesVencidas: number;
  canceladas: number;
  horasAprobadas: number;
  duracionPromedioHoras: number;
  /** Días promedio entre el pedido y el inicio, de las aprobadas. */
  anticipacionPromedioDias: number;
  espaciosUsados: number;
  usuarios: number;
}

export type Comparacion = 'anterior' | 'anio';

export interface ResumenReservas {
  desde: string;
  hasta: string;
  actual: TotalesReservas;
  /** Los mismos días inmediatamente antes del período, o del año pasado. */
  anterior: TotalesReservas;
  /** Fechas del período contra el que se compara. */
  desdeAnterior?: string;
  hastaAnterior?: string;
  comparacion?: Comparacion;
  espaciosTotal: number;
  granularidad: 'dia' | 'semana' | 'mes';
  serie: PuntoSerieReservas[];
  /** Siempre por día, para el calendario y los mini gráficos. */
  diario: PuntoSerieReservas[];
  porRol: Array<{ nombre: string; total: number; aprobadas: number }>;
}

export interface PuntoSerieReservas {
  periodo: string;
  aprobadas: number;
  pendientes: number;
  canceladas: number;
}

export interface OcupacionEspacio {
  espacioId: number;
  espacioNombre: string;
  edificioNombre: string | null;
  horasReservadas: number;
  horasDisponibles: number;
  reservas: number;
  porcentaje: number;
}

export interface HeatmapCelda {
  diaSemana: number;
  hora: number;
  cant: number;
}

export interface ResumenCarrera {
  carreraId: number | null;
  carreraNombre: string;
  aprobadas: number;
  canceladas: number;
  pendientes: number;
  /** Canceladas con menos de 24 h de aviso. */
  canceladasTarde: number;
  tasaCancelacion: number;
}

export interface ResumenEdificio {
  edificioId: number | null;
  edificioNombre: string;
  cantReservas: number;
}

export interface TopUsuario {
  usuarioId: number;
  nombre: string;
  email: string;
  rol: string;
  /** Todas las pedidas en el período, en cualquier estado. */
  cantReservas: number;
  aprobadas: number;
  canceladas: number;
}

export interface GrupoInventario {
  id: number;
  nombre: string;
  /** El edificio, para los espacios. */
  detalle: string | null;
  items: number;
  unidades: number;
  disponibles: number;
  mantenimiento: number;
  danados: number;
}

export interface OpcionFiltro {
  id: number;
  nombre: string;
  /** El edificio de un espacio. */
  padreId: number | null;
}

export interface EstadoInventario {
  totales: { items: number; unidades: number; disponibles: number; mantenimiento: number; danados: number; sinEspacio: number };
  /** null cuando se filtra por un espacio. */
  cobertura: { espacios: number; conInventario: number } | null;
  porTipo: GrupoInventario[];
  porEspacio: GrupoInventario[];
  matriz: Array<{ espacioId: number; tipoId: number; items: number; unidades: number }>;
  atencion: Array<{
    id: number;
    tipo: string;
    espacio: string | null;
    estado: 'MANTENIMIENTO' | 'DANADO';
    cantidad: number;
    diasSinCambios: number;
    observaciones: string | null;
  }>;
  antiguedad: { menosDe30Dias: number; de30a90Dias: number; de90DiasAUnAnio: number; masDeUnAnio: number; sinCambiosHace6Meses: number };
  opciones: { edificios: OpcionFiltro[]; espacios: OpcionFiltro[]; tipos: OpcionFiltro[] };
}

export interface FiltrosInventario {
  edificioId?: number | null;
  espacioId?: number | null;
  tipoElementoId?: number | null;
}

export interface AltaInventario {
  tipo: string;
  items: number;
  unidades: number;
}

export interface EvolucionEstadoPunto {
  fecha: string;
  disponibles: number;
  mantenimiento: number;
  danados: number;
}

export interface EvolucionParquePunto {
  fecha: string;
  items: number;
  unidades: number;
}

export interface DeltaInventarioFila {
  espacioId: number;
  espacioNombre: string;
  itemsInicio: number;
  itemsFin: number;
  unidadesInicio: number;
  unidadesFin: number;
  deltaItems: number;
  deltaUnidades: number;
}

export interface DeltaInventario {
  fechaInicio: string;
  fechaFin: string;
  porEspacio: DeltaInventarioFila[];
}

export interface ForecastHistoricoPunto {
  fecha: string;
  real: number;
}

export interface ForecastPrediccionPunto {
  fecha: string;
  prediccion: number;
  bandaInferior: number | null;
  bandaSuperior: number | null;
}

export interface ForecastDemanda {
  modeloId: number | null;
  trainedAt: string | null;
  mape: number | null;
  /** "Hoy" del campus segun el servidor, para saber si el horizonte quedo atras. */
  hoy?: string;
  historico: ForecastHistoricoPunto[];
  predicciones: ForecastPrediccionPunto[];
  /** Reservas ya aprobadas para cada dia del horizonte. */
  reservadas?: ForecastReservadasPunto[];
}

export interface ForecastReservadasPunto {
  fecha: string;
  cantidad: number;
}

export interface ValidacionPunto {
  fecha: string;
  real: number;
  prediccion: number;
  /** Repetir la ultima semana conocida: la referencia que el modelo tiene que superar. */
  ingenuo: number;
}

export interface CalidadModelo {
  modeloId: number | null;
  algoritmo?: string;
  trainedAt?: string;
  sampleSize?: number;
  holdoutSize?: number;
  mape?: number | null;
  mae?: number | null;
  wape?: number | null;
  wapeIngenuo?: number | null;
  estacionalidadAnual?: boolean | null;
  historicoDesde?: string | null;
  historicoHasta?: string | null;
  validacion?: ValidacionPunto[];
  notas?: string;
}

// ------------------------------------------------------------- Predicciones

/** Qué modelo reentrena el botón de cada vista de Predicciones. */
export type ModeloML = 'reservas' | 'inventario' | 'academico' | 'todo';

export interface SerieTipoEspacioPunto {
  fecha: string;
  prediccion: number;
  bandaInferior: number | null;
  bandaSuperior: number | null;
  reservadas: number;
}

/** Pronóstico de reservas de un tipo de espacio (Aula, Laboratorio…). */
export interface TipoEspacioML {
  tipoEspacioId: number;
  nombre: string;
  espacios: number;
  entrenado: boolean;
  wape: number | null;
  wapeIngenuo: number | null;
  promedioDiarioHistorico: number | null;
  esperadoProximos7: number | null;
  esperadoProximos30: number | null;
  /** Promedio diario esperado a 30 días contra el de los últimos 30 días del histórico. */
  cambioPct: number | null;
  reservadasProximos7: number | null;
  picoFecha: string | null;
  picoValor: number | null;
  serie: SerieTipoEspacioPunto[];
}

export interface TiposEspacioML {
  tipos: TipoEspacioML[];
}

export type RiesgoInventario = 'sin_stock' | 'alto' | 'medio' | 'bajo';

export interface DiaInventarioML {
  fecha: string;
  /** Pico esperado de unidades pedidas a la vez. */
  prediccion: number;
  bandaInferior: number | null;
  bandaSuperior: number | null;
  /** Pico de unidades que ya están pedidas para ese día. */
  comprometidas: number;
  /** P(pedir más que el stock disponible hoy). */
  probFaltante: number;
}

export interface SemanaInventarioML {
  semana: string;
  picoEsperado: number;
  probFaltanteMax: number;
  comprometidasMax: number;
}

export interface TipoInventarioML {
  tipoElementoId: number;
  nombre: string;
  status: 'ok' | 'omitido';
  detalle: string | null;
  stockDisponible: number | null;
  stockTotal: number | null;
  mediaHistorica: number | null;
  wape: number | null;
  wapeIngenuo: number | null;
  alpha: number | null;
  tendenciaSemanalPct: number | null;
  diaSemana: Array<{ dia: string; multiplicador: number }> | null;
  picoEsperado: number | null;
  fechaPico: string | null;
  probFaltanteMax: number | null;
  diasEnRiesgo: number | null;
  riesgo: RiesgoInventario | null;
  serie: DiaInventarioML[];
  semanas: SemanaInventarioML[] | null;
}

export interface PrediccionInventario {
  modelo: {
    entrenado: boolean;
    algoritmo?: string | null;
    entrenadoEn?: string | null;
    wape?: number | null;
    wapeIngenuo?: number | null;
    historicoDesde?: string | null;
    historicoHasta?: string | null;
    holdoutDias?: number | null;
    horizonteDias?: number | null;
    intervalo?: number | null;
  };
  resumen?: {
    tipos: number;
    tiposEnRiesgo: number;
    tiposSinStock: number;
    primerFaltante: { tipoElementoId: number; nombre: string; fecha: string; probabilidad: number } | null;
  } | null;
  tipos: TipoInventarioML[];
}

export type RiesgoTutoria = 'vacia' | 'baja' | 'normal' | 'alta' | 'sin_prediccion';

export interface InscripcionML {
  estudiante: string;
  probabilidad: number | null;
  asistenciasPrevias: number;
  inscripcionesPrevias: number;
}

export interface TutoriaProximaML {
  tutoriaId: number;
  materia: string;
  carrera: string | null;
  docente: string | null;
  inicio: string;
  modalidad: string | null;
  tipo: string | null;
  espacio: string | null;
  capacidadEspacio: number | null;
  cupo: number | null;
  inscriptos: number;
  /** Suma de las probabilidades; null si la tutoría es posterior al entrenamiento. */
  esperados: number | null;
  bandaInferior: number | null;
  bandaSuperior: number | null;
  tasaEsperada: number | null;
  riesgo: RiesgoTutoria;
  inscripciones: InscripcionML[];
}

export interface FactorAsistencia {
  clave: string;
  nombre: string;
  /** Cuánto se multiplican las chances de asistir por cada desvío estándar de más. */
  oddsRatio: number;
  efecto: 'sube' | 'baja' | 'neutro';
}

export interface PrediccionAcademico {
  modelo: {
    entrenado: boolean;
    algoritmo?: string | null;
    entrenadoEn?: string | null;
    muestras?: number | null;
    tasaBase?: number | null;
    auc?: number | null;
    brier?: number | null;
    brierBase?: number | null;
    logLoss?: number | null;
    exactitud?: number | null;
    validacion?: { desde: string; hasta: string; n: number } | null;
    calibracion?: Array<{ desde: number; hasta: number; predicho: number | null; real: number | null; n: number }>;
    factores?: FactorAsistencia[];
    historicoSemanal?: Array<{ semana: string; inscriptos: number; asistieron: number; esperados: number }>;
  };
  resumen?: {
    proximas: number;
    inscriptos: number;
    esperados: number;
    tasaEsperada: number | null;
    enRiesgoVacias: number;
    desbordadas: number;
  } | null;
  proximas: TutoriaProximaML[];
}

interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Filtros comunes a todos los endpoints de estadísticas de reservas. */
export interface FiltrosReservas {
  edificioId?: number | null;
  espacioId?: number | null;
  tipoEspacioId?: number | null;
  rol?: string | null;
  carreraId?: number | null;
}

export type ConsultaReservas = RangoFechas & FiltrosReservas;

export interface OpcionesReservas {
  edificios: Array<{ id: number; nombre: string }>;
  espacios: Array<{ id: number; nombre: string; edificioId: number | null; tipoEspacioId: number | null }>;
  tiposEspacio: Array<{ id: number; nombre: string }>;
  roles: string[];
  carreras: Array<{ id: number; nombre: string }>;
}

export interface TramoCantidad {
  tramo: string;
  cantidad: number;
}

export interface AnalistaAprobacion {
  usuarioId: number;
  nombre: string;
  asignadas: number;
  pendientes: number;
  vencidas: number;
  aprobadas: number;
  canceladas: number;
  medianaHoras: number | null;
}

export interface Aprobacion {
  respuesta: { resueltas: number; conDato: number; medianaHoras: number | null; p90Horas: number | null; dentroDe24hPct: number | null };
  distribucionRespuesta: TramoCantidad[];
  analistas: AnalistaAprobacion[];
  antelacion: Array<{ tramo: string; total: number; aprobadas: number; canceladas: number; pendientes: number }>;
  pendientesPorAntiguedad: Array<{ tramo: string; cantidad: number; vencidas: number }>;
}

export interface UsoEspacio {
  espacioId: number;
  nombre: string;
  edificioNombre: string | null;
  tipoEspacio: string | null;
  capacidad: number | null;
  horas: number;
  reservas: number;
  ocupacionPct: number;
  cupoPromedio: number | null;
  usoCapacidadPct: number | null;
}

export interface SaturacionCelda {
  tipoEspacio: string;
  espacios: number;
  hora: number;
  ocupacionPct: number;
  horasLlenas: number;
}

export interface UsoCapacidad {
  tipo: 'TUTORIA' | 'EVENTO' | string;
  id: number;
  titulo: string;
  fecha: string;
  espacioNombre: string | null;
  capacidad: number | null;
  cupo: number | null;
  inscriptos: number;
  usoPct: number | null;
}

export interface EspaciosReservas {
  espacios: UsoEspacio[];
  saturacion: SaturacionCelda[];
  capacidad: UsoCapacidad[];
}

export interface EstadosSolicitud {
  solicitudes: number;
  unidades: number;
  pendientes: number;
  aprobadas: number;
  entregadas: number;
  rechazadas: number;
}

export interface EquipoPorTipo extends EstadosSolicitud {
  tipoElementoId: number;
  nombre: string;
  disponibles: number;
  enInventario: number;
  maxUnidadesDia: number;
}

/** Qué equipos se piden con las reservas del período, contra el inventario. */
export interface DemandaInventario {
  totales: EstadosSolicitud;
  porTipo: EquipoPorTipo[];
  espaciosConProblemas: Array<{ espacioId: number; nombre: string; reservas: number; itemsConProblema: number }>;
}

export interface Academico {
  tutorias: {
    total: number;
    presenciales: number;
    virtuales: number;
    grupales: number;
    individuales: number;
    cupoTotal: number;
    agendadas: number;
    asistieron: number;
    ocupacionCupoPct: number | null;
    asistenciaPct: number | null;
    ratingPromedio: number | null;
    feedbacks: number;
  };
  porMateria: Array<{ materiaId: number; nombre: string; carreraNombre: string | null; tutorias: number; agendadas: number; asistieron: number; ratingPromedio: number | null }>;
  porSemana: Array<{ semana: string; tutorias: number; agendadas: number; asistieron: number }>;
  eventos: { total: number; inscripciones: number; cupoTotal: number; ratingPromedio: number | null };
  eventosLista: Array<{ id: number; titulo: string; tipo: string; fecha: string; espacioNombre: string | null; cupo: number | null; inscriptos: number; ratingPromedio: number | null }>;
}

export interface OrganizadorExterno {
  organizador: string;
  eventos: number;
  aprobadas: number;
  canceladas: number;
  /** Horas de reservas aprobadas. */
  horas: number;
  /** Espacios distintos que usó. */
  espacios: number;
}

export interface ExternosReservas {
  total: number;
  organizadores: OrganizadorExterno[];
}

export interface Novedad {
  tipo: 'espacio' | 'carrera' | 'rol' | 'edificio' | 'hora' | 'aprobacion' | string;
  clave: string | null;
  titulo: string;
  metrica: string;
  antes: number;
  ahora: number;
  cambio: number;
  unidad: 'pp' | '%' | 'h' | string;
  sentido: 'sube' | 'baja' | string;
  bueno: boolean | null;
}

const buildRangeQuery = ({ desde, hasta }: RangoFechas) =>
  `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

/** Rango + filtros (+ extras), sin mandar los vacíos. */
export function consultaReservas(c: ConsultaReservas, extra: Record<string, string | number | null | undefined> = {}): string {
  const params = new URLSearchParams();
  const todos: Record<string, string | number | null | undefined> = {
    desde: c.desde,
    hasta: c.hasta,
    edificioId: c.edificioId,
    espacioId: c.espacioId,
    tipoEspacioId: c.tipoEspacioId,
    rol: c.rol,
    carreraId: c.carreraId,
    ...extra,
  };
  for (const [k, v] of Object.entries(todos)) {
    if (v != null && v !== '') params.set(k, String(v));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const statsApi = {
  // OJO: a diferencia del resto de la API, /stats/active-users devuelve el DTO pelado,
  // sin el envelope {success, data}. El tipo lo refleja para que nadie busque un .data
  // que no existe (era la razón por la que el contador de usuarios activos daba 0).
  async getActiveUsers(): Promise<ActiveUsersStats> {
    return apiRequest<ActiveUsersStats>('/stats/active-users', { method: 'GET' }) as unknown as Promise<ActiveUsersStats>;
  },

  async ocupacionPorEspacio(c: ConsultaReservas): Promise<ApiResponse<OcupacionEspacio[]>> {
    return apiRequest<OcupacionEspacio[]>(`/stats/reservas/ocupacion${consultaReservas(c)}`, { method: 'GET' });
  },

  async heatmapDiaHora(c: ConsultaReservas): Promise<ApiResponse<HeatmapCelda[]>> {
    return apiRequest<HeatmapCelda[]>(`/stats/reservas/heatmap${consultaReservas(c)}`, { method: 'GET' });
  },

  async resumenPorCarrera(c: ConsultaReservas): Promise<ApiResponse<ResumenCarrera[]>> {
    return apiRequest<ResumenCarrera[]>(`/stats/reservas/por-carrera${consultaReservas(c)}`, { method: 'GET' });
  },

  async resumenPorEdificio(c: ConsultaReservas): Promise<ApiResponse<ResumenEdificio[]>> {
    return apiRequest<ResumenEdificio[]>(`/stats/reservas/por-edificio${consultaReservas(c)}`, { method: 'GET' });
  },

  async topUsuarios(c: ConsultaReservas & { limite?: number }): Promise<ApiResponse<TopUsuario[]>> {
    const { limite, ...resto } = c;
    return apiRequest<TopUsuario[]>(`/stats/reservas/top-usuarios${consultaReservas(resto, { limite })}`, { method: 'GET' });
  },

  async opcionesReservas(): Promise<ApiResponse<OpcionesReservas>> {
    return apiRequest<OpcionesReservas>('/stats/reservas/opciones', { method: 'GET' });
  },

  async aprobacionReservas(c: ConsultaReservas): Promise<ApiResponse<Aprobacion>> {
    return apiRequest<Aprobacion>(`/stats/reservas/aprobacion${consultaReservas(c)}`, { method: 'GET' });
  },

  async espaciosReservas(c: ConsultaReservas): Promise<ApiResponse<EspaciosReservas>> {
    return apiRequest<EspaciosReservas>(`/stats/reservas/espacios${consultaReservas(c)}`, { method: 'GET' });
  },

  async externosReservas(c: ConsultaReservas): Promise<ApiResponse<ExternosReservas>> {
    return apiRequest<ExternosReservas>(`/stats/reservas/externos${consultaReservas(c)}`, { method: 'GET' });
  },

  async demandaInventario(c: RangoFechas & FiltrosInventario): Promise<ApiResponse<DemandaInventario>> {
    const params = new URLSearchParams({ desde: c.desde, hasta: c.hasta });
    if (c.edificioId != null) params.set('edificioId', String(c.edificioId));
    if (c.espacioId != null) params.set('espacioId', String(c.espacioId));
    if (c.tipoElementoId != null) params.set('tipoElementoId', String(c.tipoElementoId));
    return apiRequest<DemandaInventario>(`/stats/inventario/demanda?${params.toString()}`, { method: 'GET' });
  },

  async academico(c: ConsultaReservas): Promise<ApiResponse<Academico>> {
    return apiRequest<Academico>(`/stats/academico${consultaReservas(c)}`, { method: 'GET' });
  },

  async novedadesReservas(c: ConsultaReservas & { comparar?: Comparacion }): Promise<ApiResponse<Novedad[]>> {
    const { comparar, ...resto } = c;
    return apiRequest<Novedad[]>(`/stats/reservas/novedades${consultaReservas(resto, { comparar })}`, { method: 'GET' });
  },

  async evolucionEstadoInventario(rango: RangoFechas): Promise<ApiResponse<EvolucionEstadoPunto[]>> {
    return apiRequest<EvolucionEstadoPunto[]>(`/stats/inventario/evolucion-estado${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async evolucionParqueInventario(rango: RangoFechas): Promise<ApiResponse<EvolucionParquePunto[]>> {
    return apiRequest<EvolucionParquePunto[]>(`/stats/inventario/evolucion-parque${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async deltaInventario(fechaInicio: string, fechaFin: string): Promise<ApiResponse<DeltaInventario>> {
    const qs = `?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`;
    return apiRequest<DeltaInventario>(`/stats/inventario/delta${qs}`, { method: 'GET' });
  },

  async estadoInventario(filtros: FiltrosInventario): Promise<ApiResponse<EstadoInventario>> {
    const params = new URLSearchParams();
    if (filtros.edificioId != null) params.set('edificioId', String(filtros.edificioId));
    if (filtros.espacioId != null) params.set('espacioId', String(filtros.espacioId));
    if (filtros.tipoElementoId != null) params.set('tipoElementoId', String(filtros.tipoElementoId));
    const query = params.toString();
    return apiRequest<EstadoInventario>(`/stats/inventario/estado${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  async altasInventario(rango: RangoFechas): Promise<ApiResponse<AltaInventario[]>> {
    return apiRequest<AltaInventario[]>(`/stats/inventario/altas${buildRangeQuery(rango)}`, { method: 'GET' });
  },

  async resumenReservas(c: ConsultaReservas & { comparar?: Comparacion }): Promise<ApiResponse<ResumenReservas>> {
    const { comparar, ...resto } = c;
    return apiRequest<ResumenReservas>(`/stats/reservas/resumen${consultaReservas(resto, { comparar })}`, { method: 'GET' });
  },

  /** Sin tipo, el pronóstico del campus; con tipo, el del modelo de ese tipo de espacio. */
  async forecastDemanda(diasHistorico = 90, tipoEspacioId?: number | null): Promise<ApiResponse<ForecastDemanda>> {
    const tipo = tipoEspacioId == null ? '' : `&tipoEspacioId=${tipoEspacioId}`;
    return apiRequest<ForecastDemanda>(`/stats/ml/forecast?diasHistorico=${diasHistorico}${tipo}`, { method: 'GET' });
  },

  async calidadModeloML(tipoEspacioId?: number | null): Promise<ApiResponse<CalidadModelo>> {
    const tipo = tipoEspacioId == null ? '' : `?tipoEspacioId=${tipoEspacioId}`;
    return apiRequest<CalidadModelo>(`/stats/ml/calidad-modelo${tipo}`, { method: 'GET' });
  },

  async tiposEspacioML(): Promise<ApiResponse<TiposEspacioML>> {
    return apiRequest<TiposEspacioML>('/stats/ml/tipos-espacio', { method: 'GET' });
  },

  async inventarioML(): Promise<ApiResponse<PrediccionInventario>> {
    return apiRequest<PrediccionInventario>('/stats/ml/inventario', { method: 'GET' });
  },

  async academicoML(): Promise<ApiResponse<PrediccionAcademico>> {
    return apiRequest<PrediccionAcademico>('/stats/ml/academico', { method: 'GET' });
  },

  async reentrenarModeloML(modelo: ModeloML = 'reservas'): Promise<ApiResponse<Record<string, unknown>>> {
    return apiRequest<Record<string, unknown>>(`/stats/ml/reentrenar?modelo=${modelo}`, { method: 'POST' });
  },

  async getRecentErrors(top = 10, hoursBack = 24): Promise<RecentErrorsResponse> {
    const r = await apiRequest<RecentErrorsResponse>(`/system/errors?top=${top}&hoursBack=${hoursBack}`, { method: 'GET' });
    return (r.data ?? (r as unknown as RecentErrorsResponse));
  },

  async getSlowEndpoints(top = 10): Promise<SlowEndpointsResponse> {
    const r = await apiRequest<SlowEndpointsResponse>(`/system/slow-endpoints?top=${top}`, { method: 'GET' });
    return (r.data ?? (r as unknown as SlowEndpointsResponse));
  },
};

export interface RecentError {
  level: string;
  message: string;
  logger: string;
  exception: string | null;
  count: number;
  lastTimestamp: string;
}

export interface RecentErrorsResponse {
  totalCaptured: number;
  totalGroupsInWindow: number;
  windowHours: number;
  top: RecentError[];
}

export interface SlowEndpoint {
  uri: string;
  method: string;
  status: string;
  count: number;
  meanMs: number;
  maxMs: number;
  p95: number;
  p99: number;
}

export interface SlowEndpointsResponse {
  unit: string;
  top: SlowEndpoint[];
}

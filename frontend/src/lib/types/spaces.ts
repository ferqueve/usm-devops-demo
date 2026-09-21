export interface TipoEspacio {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string; // Hex color
  activo: boolean;
}

export interface Espacio {
  id: number;
  nombre: string;
  capacidad: number;
  imagenUrl?: string;
  /** Versión reducida para listados. Puede faltar en fotos viejas. */
  imagenThumbUrl?: string;
  tipoEspacioId: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string; // Color del tipo de espacio
  estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE';
  edificioId?: number;
  edificioNombre?: string;
  edificioCodigo?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Edificio {
  id: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoElemento {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface InventarioItem {
  id: number;
  espacioId: number | null; // null cuando no está asignado a ningún espacio
  espacioNombre: string;
  espacioColor?: string; // Hex color del espacio
  tipoElementoId: number;
  tipoElementoNombre: string;
  cantidad: number;
  estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FiltroInventario {
  tipoElementoId: number;
  cantidadMin?: number;
  cantidadMax?: number;
}

export interface EspacioFilters {
  search?: string;
  tipoEspacioId?: number;
  edificioId?: number;
  capacidadMin?: number;
  capacidadMax?: number;
  estado?: 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE';
  filtrosInventario?: FiltroInventario[];
}

// Tipos para paginación
// Forma estándar de las respuestas paginadas del backend (Spring Pageable).
export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export type PagedEspacios = PagedResponse<Espacio>;
export type PagedInventario = PagedResponse<InventarioItem>;

export interface InventarioFilters {
  search?: string;
  espacioId?: number;
  tipoElementoId?: number;
  estado?: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
  sinAsignar?: boolean;
}

export interface Carrera {
  id: number;
  nombre: string;
  codigo?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ReservaItemSolicitadoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ENTREGADO';

export interface ReservaItemSolicitado {
  id: number;
  reservaId: number;
  espacioId?: number | null;
  espacioNombre?: string;
  usuarioId?: number | null;
  solicitanteNombre?: string;
  solicitanteEmail?: string;
  tipoElementoId: number;
  tipoElementoNombre: string;
  inventarioItemId?: number | null;
  cantidadSolicitada: number;
  estado: ReservaItemSolicitadoEstado;
  observaciones?: string;
  reservaInicio?: string;
  reservaFin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reserva {
  analistaId?: number | null;
  analistaNombre?: string | null;
  analistaEmail?: string | null;
  id: number;
  espacioId: number;
  espacioNombre: string;
  espacioImagen?: string;
  capacidadEspacio: number;
  tipoEspacioId?: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string; // Color del tipo de espacio
  titulo: string;
  motivoSolicitud?: string;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  carreraId?: number;
  carreraNombre?: string;
  carreraCodigo?: string;
  inicio: string; // ISO datetime
  fin: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'CANCELADO';
  esPublica?: boolean;
  mensajeAnalista?: string;
  itemsSolicitados?: ReservaItemSolicitado[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservaStats {
  // Métricas básicas
  totalReservas: number;
  totalAprobadas: number;
  totalPendientes: number;
  totalCanceladas: number;
  totalFuturas: number;
  totalPasadas: number;
  totalActivas: number;
  reservasPorEstado: Record<string, number>;
  
  // Métricas temporales
  reservasEsteMes: number;
  reservasProximoMes: number;
  reservasEsteAnio: number;
  reservasPorMes: Record<string, number>;
  reservasPorDiaSemana: Record<string, number>;
  mesConMasReservas?: string | null;
  promedioReservasPorMes: number;
  
  // Métricas de espacios
  totalEspaciosUsados: number;
  espacioMasUsado?: number | null;
  nombreEspacioMasUsado?: string | null;
  reservasPorEspacio: Record<string, number>;
  distribucionPorEspacio: Record<string, number>;
  
  // Métricas de uso y duración
  duracionTotalHoras: number;
  duracionPromedioHoras: number;
  reservaMasLargaHoras: number;
  reservaMasCortaHoras: number;
  horasReservadasEsteMes: number;
  
  // Métricas de frecuencia
  promedioReservasPorSemana: number;
  diasDesdeUltimaReserva?: number | null;
  diasHastaProximaReserva?: number | null;
  fechaUltimaReserva?: string | null; // ISO datetime
  fechaProximaReserva?: string | null; // ISO datetime
  
  // Métricas comparativas
  reservasMesActual: number;
  reservasMesAnterior: number;
  diferenciaMesAnterior: number;
  porcentajeCambioMesAnterior: number;
}

export interface EspacioStats {
  totalEspacios?: number;
  espaciosDisponibles?: number;
  espaciosMantenimiento?: number;
  espaciosNoDisponibles?: number;
  espaciosPorTipo?: Record<string, number>;
  espaciosPorEdificio?: Record<string, number>;
  capacidadTotal?: number;
  capacidadPromedio?: number;
  [key: string]: unknown;
}

// Identificadores para grupos del inventario
interface TipoElementoRef {
  tipoId: number;
  tipoNombre: string;
}

interface EspacioRef {
  espacioId: number;
  espacioNombre: string;
}

// Métricas resumen de un grupo (top, ranking)
interface InventoryGroupSummary {
  cantidad: number;
  items: number;
}

// Métricas por estado dentro de un grupo
interface InventoryStatusBreakdown extends InventoryGroupSummary {
  disponibles: number;
  mantenimiento: number;
  danados: number;
}

// Indicador de problemas de un grupo (espacios o tipos)
interface InventoryProblemSummary {
  problemas: number;
  porcentaje: number;
}

export type InventoryByTipo = TipoElementoRef & InventoryStatusBreakdown;
export type InventoryByEspacio = EspacioRef & InventoryStatusBreakdown;
export type InventoryTopTipo = TipoElementoRef & InventoryGroupSummary;
export type InventoryTopEspacio = EspacioRef & InventoryGroupSummary;
export type InventoryProblemTipo = TipoElementoRef & InventoryProblemSummary;
export type InventoryProblemEspacio = EspacioRef & InventoryProblemSummary;

export interface InventoryStats {
  // === TOTALES Y BÁSICAS ===
  totalItems: number;
  totalCantidad: number;
  disponibles: number;
  mantenimiento: number;
  danados: number;
  sinAsignar: number;
  asignados: number;
  itemsInactivos: number;

  // === PORCENTAJES ===
  porcentajeDisponibles: number;
  porcentajeMantenimiento: number;
  porcentajeDanados: number;
  porcentajeSinAsignar: number;
  porcentajeAsignados: number;
  porcentajeInactivos: number;

  // === POR TIPO DE ELEMENTO ===
  itemsPorTipo: InventoryByTipo[];
  tiposUnicos: number;

  // === POR ESPACIO ===
  itemsPorEspacio: InventoryByEspacio[];
  espaciosConInventario: number;

  // === TOP RANKINGS ===
  topEspacios: InventoryTopEspacio[];
  topTipos: InventoryTopTipo[];
  espaciosConMasProblemas: InventoryProblemEspacio[];
  tiposConMasProblemas: InventoryProblemTipo[];
  
  // === PROMEDIOS ===
  promedioItemsPorEspacio: number;
  promedioCantidadPorItem: number;
  promedioItemsPorTipo: number;
  promedioCantidadPorEspacio: number;
  promedioCantidadPorTipo: number;
  
  // === ANÁLISIS TEMPORAL ===
  itemsCreadosEsteMes: number;
  itemsCreadosEsteAnio: number;
  itemsCreadosUltimos6Meses: number;
  itemsCreadosUltimos12Meses: number;
  itemsActualizadosEsteMes: number;
  itemsActualizadosUltimos7Dias: number;
  
  // === ANÁLISIS DE EDAD ===
  itemsRecientes: number;
  itemsJovenes: number;
  itemsViejos: number;
  promedioAntiguedadDias: number;
  promedioTiempoSinActualizarDias: number;
  itemsSinActualizarMasDe6Meses: number;
  
  // === SALUD DEL INVENTARIO ===
  ratioSalud: number;
  ratioProblemas: number;
  ratioAsignacion: number;
  indiceCobertura: number;
  
  // === ITEMS CRÍTICOS ===
  itemsCriticos: number;
  itemsSinAsignarConProblemas: number;
  espaciosSinInventario: number;
  tiposSinItems: number;
  
  // === ANÁLISIS DE DISTRIBUCIÓN ===
  espaciosConSoloDisponibles: number;
  espaciosConSoloMantenimiento: number;
  espaciosConSoloDanados: number;
  espaciosConMezclaEstados: number;
  tiposConSoloDisponibles: number;
  tiposConSoloMantenimiento: number;
  tiposConSoloDanados: number;
  tiposConMezclaEstados: number;
  
  // === ANÁLISIS DE CANTIDAD ===
  itemsConCantidad1: number;
  itemsConCantidadAlta: number;
  itemsConCantidadMedia: number;
  cantidadMaxima: number;
  cantidadMinima: number;
  cantidadTotalPromedio: number;
  
  // === ESTADÍSTICAS DE OBSERVACIONES ===
  itemsConObservaciones: number;
  itemsSinObservaciones: number;
  porcentajeConObservaciones: number;
  
  // === COMPARATIVAS ===
  diferenciaMesAnterior: number;
  porcentajeCambioMesAnterior: number;
  diferenciaAnioAnterior: number;
  porcentajeCambioAnioAnterior: number;
  
  // === EFICIENCIA ===
  eficienciaAsignacion: number;
  densidadInventario: number;
  concentracionInventario: number;
}
export type TipoRecomendacion = 
  | 'ESPACIO_PARA_RESERVA'
  | 'HORARIO_OPTIMO'
  | 'ESPACIO_SIMILAR'
  | 'ITEM_MANTENIMIENTO_URGENTE'
  | 'ESPACIO_ATENCION'
  | 'REASIGNACION_ITEM'
  | 'COMPRA_NECESARIA'
  | 'ITEM_RECOMENDADO_RESERVA'
  | 'COMBINACION_ITEMS'
  | 'ASIGNACION_ANALISTA'
  | 'RESERVA_PRIORITARIA'
  | 'ESPACIO_MEJORA'
  | 'OPTIMIZACION_RECURSOS';

export interface RecomendacionBase {
  id?: number;
  tipoRecomendacion: TipoRecomendacion;
  puntaje: number;
  razon: string;
  metadata?: Record<string, unknown>;
}

export interface RecomendacionEspacio extends RecomendacionBase {
  espacioId: number;
  espacioNombre: string;
  espacioImagen?: string;
  capacidad: number;
  tipoEspacioId?: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string;
  estado?: string;
  disponible?: boolean;
}

export interface RecomendacionItem extends RecomendacionBase {
  tipoElementoId: number;
  tipoElementoNombre: string;
  tipoElementoDescripcion?: string;
  cantidadRecomendada?: number;
  disponible?: boolean;
  cantidadDisponible?: number;
  espacioId?: number;
  espacioNombre?: string;
}

export interface RecomendacionInventario extends RecomendacionBase {
  inventarioItemId?: number;
  tipoElementoId?: number;
  tipoElementoNombre?: string;
  cantidad?: number;
  estado?: string;
  fechaUltimoMantenimiento?: string;
  diasEnMantenimiento?: number;
  espacioId?: number;
  espacioNombre?: string;
  espacioAsignado?: boolean;
  espacioRecomendadoId?: number;
  espacioRecomendadoNombre?: string;
  razonReasignacion?: string;
  cantidadNecesaria?: number;
  stockActual?: number;
  frecuenciaUso?: number;
}

export interface RecomendacionAnalista extends RecomendacionBase {
  analistaId?: number;
  analistaNombre?: string;
  analistaEmail?: string;
  cargaTrabajoActual?: number;
  reservasPendientes?: number;
  reservasCompletadas?: number;
  tasaAprobacion?: number;
  reservaId?: number;
  docenteId?: number;
  docenteNombre?: string;
  docenteEmail?: string;
  espacioId?: number;
  espacioNombre?: string;
  inicio?: string;
  fin?: string;
  diasPendiente?: number;
  urgencia?: number;
}

export interface HorarioRecomendado {
  inicio: string;
  fin: string;
  puntaje: number;
  razon: string;
  disponible?: boolean;
  conflictosPotenciales?: number;
  metadata?: Record<string, unknown>;
}

export interface DashboardRecomendaciones {
  espaciosRecomendados?: RecomendacionEspacio[];
  itemsRecomendados?: RecomendacionItem[];
  mantenimientoUrgente?: RecomendacionInventario[];
  reservasPrioritarias?: RecomendacionAnalista[];
  totalRecomendaciones: number;
}


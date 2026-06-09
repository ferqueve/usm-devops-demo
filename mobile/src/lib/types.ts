/**
 * Tipos de dominio, espejados desde `frontend/src/lib/types/`.
 * Solo se incluyen los campos que la app mobile consume; se irá ampliando por pantalla.
 */

// ===== Envelope de respuesta del backend =====
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number; // página actual (0-based)
  size: number;
  first: boolean;
  last: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  numberOfElements?: number;
};

// ===== Auth / Usuario =====
export type UserRole =
  | 'ADMIN'
  | 'ANALISTA'
  | 'DOCENTE'
  | 'ESTUDIANTE'
  | 'EXTERNO'
  | 'MANTENIMIENTO';

export type AuthResponse = {
  token: string;
  refreshToken: string;
  email: string;
  nombre: string;
  rol: UserRole;
  expiresIn: number;
  userId: number;
};

export type SessionUser = {
  id: number;
  email: string;
  nombre: string;
  rol: UserRole;
};

export type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rolApp: UserRole;
  verificado: boolean;
  activo: boolean;
  oauthProv?: string | null;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserStats = {
  totalUsuarios: number;
  totalActivos: number;
  totalInactivos: number;
  totalVerificados: number;
  totalNoVerificados: number;
  usuariosPorRol?: Record<string, number>;
};

// ===== Auditoría =====
export type AuditLogAccion = 'CREATE' | 'UPDATE' | 'DELETE';

export type AuditLog = {
  id: number;
  entidad: string;
  entidadId: number;
  accion: AuditLogAccion;
  usuarioId: number | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  timestamp: string;
  datosPrevios: string | null;
  datosNuevos: string | null;
};

// ===== Espacios =====
export type EspacioEstado = 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE';

export type Espacio = {
  id: number;
  nombre: string;
  capacidad: number;
  imagenUrl?: string;
  tipoEspacioId?: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string;
  estado: EspacioEstado;
  edificioId?: number;
  edificioNombre?: string;
  edificioCodigo?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TipoEspacio = {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo?: boolean;
};

export type Edificio = {
  id: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
};

export type EspacioStats = {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
  capacidadMaxima?: number;
  capacidadMinima?: number;
  capacidadPromedio?: number;
};

// ===== Reservas =====
export type ReservaEstado = 'PENDIENTE' | 'APROBADO' | 'CANCELADO';

export type ReservaItemSolicitadoEstado =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ENTREGADO';

export type ReservaItemSolicitado = {
  id: number;
  reservaId: number;
  tipoElementoId: number;
  tipoElementoNombre: string;
  cantidadSolicitada: number;
  estado: ReservaItemSolicitadoEstado;
  observaciones?: string;
};

export type Reserva = {
  id: number;
  espacioId: number;
  espacioNombre: string;
  capacidadEspacio?: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string;
  titulo: string;
  motivoSolicitud?: string;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  carreraId?: number;
  carreraNombre?: string;
  carreraCodigo?: string;
  analistaNombre?: string | null;
  inicio: string; // ISO datetime
  fin: string;
  estado: ReservaEstado;
  esPublica?: boolean;
  mensajeAnalista?: string;
  itemsSolicitados?: ReservaItemSolicitado[];
  createdAt?: string;
  updatedAt?: string;
};

// ===== Inventario =====
export type InventarioEstado = 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';

export type InventarioItem = {
  id: number;
  espacioId: number | null;
  espacioNombre?: string;
  espacioColor?: string;
  tipoElementoId: number;
  tipoElementoNombre: string;
  cantidad: number;
  estado: InventarioEstado;
  observaciones?: string;
  activo?: boolean;
};

export type TipoElemento = {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
};

export type InventarioStats = {
  totalItems: number;
  disponibles: number;
  danados: number;
  mantenimiento: number;
  sinAsignar: number;
};

// ===== Carreras =====
export type Carrera = {
  id: number;
  nombre: string;
  codigo?: string;
};

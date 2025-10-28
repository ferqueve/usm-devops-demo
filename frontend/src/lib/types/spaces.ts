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
  tipoEspacioId: number;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string; // Color del tipo de espacio
  estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE';
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
  capacidadMin?: number;
  capacidadMax?: number;
  estado?: 'DISPONIBLE' | 'MANTENIMIENTO' | 'NO_DISPONIBLE';
  filtrosInventario?: FiltroInventario[];
}

// Tipos para paginación
export interface PagedEspacios {
  content: Espacio[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface PagedInventario {
  content: InventarioItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface InventarioFilters {
  search?: string;
  espacioId?: number;
  tipoElementoId?: number;
  estado?: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
  sinAsignar?: boolean;
}
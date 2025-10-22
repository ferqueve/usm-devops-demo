export interface TipoEspacio {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Espacio {
  id: number;
  nombre: string;
  capacidad: number;
  imagenUrl?: string;
  tipoEspacioId: number;
  tipoEspacioNombre?: string;
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
  espacioId: number;
  espacioNombre: string;
  tipoElementoId: number;
  tipoElementoNombre: string;
  cantidad: number;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  estado: 'DISPONIBLE' | 'MANTENIMIENTO' | 'DANADO';
  observaciones?: string;
  fechaAdquisicion?: string;
  valorEstimado?: number;
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

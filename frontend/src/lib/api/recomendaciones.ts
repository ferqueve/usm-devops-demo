import { apiRequest, type ApiResponse } from './client';
import type {
  RecomendacionEspacio,
  RecomendacionItem,
  RecomendacionInventario,
  RecomendacionAnalista,
  HorarioRecomendado,
  DashboardRecomendaciones,
} from '../types/recomendaciones';

export const recomendacionesApi = {
  // ========== RECOMENDACIONES DE RESERVAS ==========
  
  /**
   * Obtener recomendaciones de espacios para crear una reserva
   */
  async obtenerRecomendacionesEspacios(params: {
    inicio: string; // ISO datetime
    fin: string; // ISO datetime
    capacidad?: number;
  }): Promise<ApiResponse<RecomendacionEspacio[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('inicio', params.inicio);
    queryParams.append('fin', params.fin);
    if (params.capacidad) {
      queryParams.append('capacidad', params.capacidad.toString());
    }
    return apiRequest<RecomendacionEspacio[]>(
      `/recomendaciones/reservas/espacios?${queryParams.toString()}`
    );
  },
  
  /**
   * Obtener horarios óptimos para un espacio y fecha
   */
  async obtenerHorariosOptimos(params: {
    espacioId: number;
    fecha: string; // ISO datetime
  }): Promise<ApiResponse<HorarioRecomendado[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('espacioId', params.espacioId.toString());
    queryParams.append('fecha', params.fecha);
    return apiRequest<HorarioRecomendado[]>(
      `/recomendaciones/reservas/horarios?${queryParams.toString()}`
    );
  },
  
  /**
   * Obtener espacios similares a uno dado
   */
  async obtenerEspaciosSimilares(espacioId: number): Promise<ApiResponse<RecomendacionEspacio[]>> {
    return apiRequest<RecomendacionEspacio[]>(
      `/recomendaciones/reservas/espacios-similares?espacioId=${espacioId}`
    );
  },
  
  // ========== RECOMENDACIONES DE INVENTARIO ==========
  
  /**
   * Obtener items que necesitan mantenimiento urgente
   */
  async obtenerItemsMantenimiento(): Promise<ApiResponse<RecomendacionInventario[]>> {
    return apiRequest<RecomendacionInventario[]>(
      `/recomendaciones/inventario/mantenimiento`
    );
  },
  
  /**
   * Obtener espacios que requieren atención
   */
  async obtenerEspaciosAtencion(): Promise<ApiResponse<RecomendacionInventario[]>> {
    return apiRequest<RecomendacionInventario[]>(
      `/recomendaciones/inventario/espacios-atencion`
    );
  },
  
  /**
   * Obtener recomendaciones de reasignación de items
   */
  async obtenerReasignaciones(): Promise<ApiResponse<RecomendacionInventario[]>> {
    return apiRequest<RecomendacionInventario[]>(
      `/recomendaciones/inventario/reasignaciones`
    );
  },
  
  /**
   * Obtener recomendaciones de compras necesarias
   */
  async obtenerComprasNecesarias(): Promise<ApiResponse<RecomendacionInventario[]>> {
    return apiRequest<RecomendacionInventario[]>(
      `/recomendaciones/inventario/compras`
    );
  },
  
  // ========== RECOMENDACIONES DE ITEMS ==========
  
  /**
   * Obtener items recomendados para una reserva
   */
  async obtenerItemsParaReserva(espacioId: number): Promise<ApiResponse<RecomendacionItem[]>> {
    return apiRequest<RecomendacionItem[]>(
      `/recomendaciones/items/para-reserva?espacioId=${espacioId}`
    );
  },
  
  /**
   * Obtener combinaciones de items frecuentes
   */
  async obtenerCombinacionesItems(espacioId: number): Promise<ApiResponse<RecomendacionItem[]>> {
    return apiRequest<RecomendacionItem[]>(
      `/recomendaciones/items/combinaciones?espacioId=${espacioId}`
    );
  },
  
  // ========== RECOMENDACIONES DE ANALISTAS ==========
  
  /**
   * Obtener analista recomendado para un docente
   */
  async obtenerAnalistaRecomendado(docenteId: number): Promise<ApiResponse<RecomendacionAnalista[]>> {
    return apiRequest<RecomendacionAnalista[]>(
      `/recomendaciones/analistas/asignacion?docenteId=${docenteId}`
    );
  },
  
  /**
   * Obtener reservas prioritarias para un analista
   */
  async obtenerReservasPrioritarias(): Promise<ApiResponse<RecomendacionAnalista[]>> {
    return apiRequest<RecomendacionAnalista[]>(
      `/recomendaciones/analistas/prioritarias`
    );
  },
  
  // ========== RECOMENDACIONES DEL DASHBOARD ==========
  
  /**
   * Obtener recomendaciones personalizadas del dashboard según el rol
   */
  async obtenerRecomendacionesDashboard(): Promise<ApiResponse<DashboardRecomendaciones>> {
    return apiRequest<DashboardRecomendaciones>(
      `/recomendaciones/dashboard`
    );
  },
};


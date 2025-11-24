import { apiRequest, type ApiResponse } from './client';

export interface PreferenciasEmail {
  [key: string]: boolean;
}

export interface PreferenciasVista {
  reservasViewMode?: 'cards' | 'table' | 'calendar';
  reservasCalendarViewMode?: 'day' | 'week' | 'month';
  reservasPageSize?: number;
  espaciosViewMode?: 'cards' | 'table';
  espaciosPageSize?: number;
  inventarioViewMode?: 'table' | 'cards';
  inventarioPageSize?: number;
  usuariosPageSize?: number;
  auditoriaPageSize?: number;
}

export interface PreferenciasEmailResponse {
  email: PreferenciasEmail;
}

export interface PreferenciasVistaResponse {
  vista: PreferenciasVista;
}

export interface PreferenciasCompletasResponse {
  preferencias: {
    email?: PreferenciasEmail;
    vista?: PreferenciasVista;
  };
}

export const preferencesApi = {
  /**
   * Obtener todas las preferencias (email y vista) - UNA SOLA LLAMADA para evitar duplicados
   */
  async obtenerPreferencias(): Promise<ApiResponse<PreferenciasCompletasResponse>> {
    return apiRequest<PreferenciasCompletasResponse>('/preferencias', {
      method: 'GET',
    });
  },

  /**
   * Obtener preferencias de email
   */
  async obtenerPreferenciasEmail(): Promise<ApiResponse<PreferenciasEmailResponse>> {
    return apiRequest<PreferenciasEmailResponse>('/preferencias/email', {
      method: 'GET',
    });
  },

  /**
   * Obtener preferencias de vista
   */
  async obtenerPreferenciasVista(): Promise<ApiResponse<PreferenciasVistaResponse>> {
    return apiRequest<PreferenciasVistaResponse>('/preferencias/vista', {
      method: 'GET',
    });
  },

  /**
   * Actualizar preferencias de email
   */
  async actualizarPreferenciasEmail(
    preferencias: PreferenciasEmailResponse
  ): Promise<ApiResponse<PreferenciasEmailResponse>> {
    return apiRequest<PreferenciasEmailResponse>('/preferencias/email', {
      method: 'PUT',
      body: JSON.stringify(preferencias),
    });
  },

  /**
   * Actualizar preferencias de vista
   */
  async actualizarPreferenciasVista(
    preferencias: PreferenciasVistaResponse
  ): Promise<ApiResponse<PreferenciasVistaResponse>> {
    return apiRequest<PreferenciasVistaResponse>('/preferencias/vista', {
      method: 'PUT',
      body: JSON.stringify(preferencias),
    });
  },

  /**
   * Obtener emails obligatorios (que no se pueden desactivar)
   */
  async obtenerEmailsObligatorios(): Promise<ApiResponse<string[]>> {
    return apiRequest<string[]>('/preferencias/email/obligatorios', {
      method: 'GET',
    });
  },
};


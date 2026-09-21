import { actuatorRequest } from './client';
import { API_BASE_URL } from '@/lib/config/api';
import type {
  ActuatorEndpoints, AppInfo, HealthInfo, HttpTraceInfo, LiquibaseInfo,
  LoggersInfo, MappingsInfo, MetricInfo,
} from '@/lib/types/actuator';

// Constante para la URL base de la API

// API de sistema/actuator
export const actuatorApi = {
  // Health check
  async getHealth(): Promise<HealthInfo> {
    return actuatorRequest<HealthInfo>('/actuator/health');
  },

  // Métricas del sistema
  async getMetrics(): Promise<unknown> {
    return actuatorRequest('/actuator/metrics');
  },

  // Métrica específica
  async getMetric(metricName: string): Promise<MetricInfo> {
    return actuatorRequest<MetricInfo>(`/actuator/metrics/${metricName}`);
  },

  // Información de la aplicación
  async getInfo(): Promise<AppInfo> {
    return actuatorRequest<AppInfo>('/actuator/info');
  },

  // Endpoints disponibles
  async getEndpoints(): Promise<ActuatorEndpoints> {
    return actuatorRequest<ActuatorEndpoints>('/actuator');
  },

  // Trazas HTTP
  async getHttpTrace(): Promise<HttpTraceInfo> {
    return actuatorRequest<HttpTraceInfo>('/actuator/httpexchanges');
  },

  // Mapeos de endpoints
  async getMappings(): Promise<MappingsInfo> {
    return actuatorRequest<MappingsInfo>('/actuator/mappings');
  },

  // Documentación OpenAPI
  async getOpenApiDocs(): Promise<unknown> {
    return actuatorRequest('/v3/api-docs');
  },

  // Estado de Liquibase
  async getLiquibase(): Promise<LiquibaseInfo> {
    return actuatorRequest<LiquibaseInfo>('/actuator/liquibase');
  },

  // Loggers disponibles
  async getLoggers(): Promise<LoggersInfo> {
    return actuatorRequest<LoggersInfo>('/actuator/loggers');
  },

  // Cambiar nivel de logger
  async setLoggerLevel(loggerName: string, level: string): Promise<unknown> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/actuator/loggers/${loggerName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ configuredLevel: level }),
    });

    if (!response.ok) {
      const statusMessages: Record<number, string> = {
        400: 'Solicitud inválida',
        401: 'No autorizado',
        403: 'Acceso denegado',
        404: 'Recurso no encontrado',
        500: 'Error interno del servidor',
        502: 'Error de puerta de enlace',
        503: 'Servicio no disponible',
      };
      const message = statusMessages[response.status] || `Error ${response.status}`;
      throw new Error(`Error ${response.status}: ${message}`);
    }

    return response.json();
  },

  // Obtener archivo de logs
  async getLogFile(): Promise<string> {
    return actuatorRequest<string>('/actuator/logfile');
  },
};

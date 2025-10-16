import { actuatorRequest } from './client';

// Constante para la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// API de sistema/actuator
export const actuatorApi = {
  // Health check
  async getHealth(): Promise<any> {
    return actuatorRequest('/actuator/health');
  },

  // Métricas del sistema
  async getMetrics(): Promise<any> {
    return actuatorRequest('/actuator/metrics');
  },

  // Métrica específica
  async getMetric(metricName: string): Promise<any> {
    return actuatorRequest(`/actuator/metrics/${metricName}`);
  },

  // Información de la aplicación
  async getInfo(): Promise<any> {
    return actuatorRequest('/actuator/info');
  },

  // Endpoints disponibles
  async getEndpoints(): Promise<any> {
    return actuatorRequest('/actuator');
  },

  // Trazas HTTP
  async getHttpTrace(): Promise<any> {
    return actuatorRequest('/actuator/httpexchanges');
  },

  // Mapeos de endpoints
  async getMappings(): Promise<any> {
    return actuatorRequest('/actuator/mappings');
  },

  // Documentación OpenAPI
  async getOpenApiDocs(): Promise<any> {
    return actuatorRequest('/v3/api-docs');
  },

  // Estado de Liquibase
  async getLiquibase(): Promise<any> {
    return actuatorRequest('/actuator/liquibase');
  },

  // Loggers disponibles
  async getLoggers(): Promise<any> {
    return actuatorRequest('/actuator/loggers');
  },

  // Cambiar nivel de logger
  async setLoggerLevel(loggerName: string, level: string): Promise<any> {
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
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Obtener archivo de logs
  async getLogFile(): Promise<any> {
    return actuatorRequest('/actuator/logfile');
  },
};

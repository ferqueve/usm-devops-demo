import { useState, useEffect, useCallback } from 'react';
import { actuatorApi } from '@/lib/api/system';
import { statsApi } from '@/lib/api/stats';
import { toast } from 'sonner';

interface MetricsHistory {
  time: string;
  timestamp: number;
  memory: number;
  cpu: number;
  threads: number;
}

interface MetricMeasurement {
  statistic: string;
  value: number;
}

interface MetricData {
  measurements?: MetricMeasurement[];
  [key: string]: unknown;
}

export const useSystemMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  
  // Estados para los datos básicos de Actuator
  const [health, setHealth] = useState<unknown>(null);
  const [info, setInfo] = useState<unknown>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<MetricData | null>(null);
  const [cpuMetrics, setCpuMetrics] = useState<MetricData | null>(null);
  const [threadsMetrics, setThreadsMetrics] = useState<MetricData | null>(null);
  const [httpMetrics, setHttpMetrics] = useState<unknown>(null);
  const [uptimeMetrics, setUptimeMetrics] = useState<unknown>(null);
  const [gcMetrics, setGcMetrics] = useState<unknown>(null);
  const [memoryMaxMetrics, setMemoryMaxMetrics] = useState<unknown>(null);
  
  // Estados para los nuevos endpoints
  const [httpTrace, setHttpTrace] = useState<unknown>(null);
  const [mappings, setMappings] = useState<unknown>(null);
  const [liquibase, setLiquibase] = useState<unknown>(null);
  const [loggers, setLoggers] = useState<unknown>(null);
  const [logFile, setLogFile] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<unknown>(null);
  
  // Historial de métricas para gráficos en tiempo real
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);

  // Actualizar historial de métricas - optimizado para reducir frecuencia
  const updateMetricsHistory = useCallback((memory: number, cpu: number, threads: number) => {
    const timestamp = new Date();
    const newDataPoint: MetricsHistory = {
      time: timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: timestamp.getTime(),
      memory,
      cpu: cpu * 100,
      threads
    };

    setMetricsHistory(prev => {
      // Solo actualizar si han pasado al menos 2 segundos desde la última actualización
      const lastUpdate = prev.at(-1)?.timestamp;
      const timeDiff = timestamp.getTime() - (lastUpdate || 0);
      
      if (timeDiff < 2000 && prev.length > 0) {
        return prev; // No actualizar si es muy frecuente
      }
      
      const updated = [...prev, newDataPoint];
      // Mantener solo los últimos 20 puntos para mejor rendimiento
      return updated.slice(-20);
    });
  }, []);

  // Fetch de usuarios activos (separado para control de frecuencia)
  const fetchActiveUsers = useCallback(async () => {
    try {
      const data = await statsApi.getActiveUsers();
      setActiveUsers(data);
    } catch (error) {
      console.error('Error al obtener usuarios activos:', error);
    }
  }, []);

  // Fetch de Liquibase (solo al cargar la vista)
  const fetchLiquibase = useCallback(async () => {
    try {
      const data = await actuatorApi.getLiquibase();
      setLiquibase(data);
    } catch (error) {
      console.error('Error al obtener migraciones Liquibase:', error);
    }
  }, []);

  // Fetch de Info (solo al cargar la vista, info estática)
  const fetchInfo = useCallback(async () => {
    try {
      const data = await actuatorApi.getInfo();
      setInfo(data);
    } catch (error) {
      console.error('Error al obtener información de la aplicación:', error);
    }
  }, []);

  // Funciones auxiliares para reducir complejidad
  const handleConnectionError = useCallback((silent: boolean) => {
    setAutoRefresh(false);
    setHasConnectionError(true);
    if (!silent) {
      toast.error('Error de autenticación', {
        description: 'Sesión expirada. Por favor recarga la página.'
      });
    }
  }, []);

  const updateBasicMetrics = useCallback((results: {
    healthData: PromiseSettledResult<unknown>;
    memoryData: PromiseSettledResult<unknown>;
    cpuData: PromiseSettledResult<unknown>;
    threadsData: PromiseSettledResult<unknown>;
    httpData: PromiseSettledResult<unknown>;
    uptimeData: PromiseSettledResult<unknown>;
    gcData: PromiseSettledResult<unknown>;
    memoryMaxData: PromiseSettledResult<unknown>;
  }) => {
    if (results.healthData.status === 'fulfilled') setHealth(results.healthData.value);
    if (results.memoryData.status === 'fulfilled') setMemoryMetrics(results.memoryData.value as MetricData);
    if (results.cpuData.status === 'fulfilled') setCpuMetrics(results.cpuData.value as MetricData);
    if (results.threadsData.status === 'fulfilled') setThreadsMetrics(results.threadsData.value as MetricData);
    if (results.httpData.status === 'fulfilled') setHttpMetrics(results.httpData.value);
    if (results.uptimeData.status === 'fulfilled') setUptimeMetrics(results.uptimeData.value);
    if (results.gcData.status === 'fulfilled') setGcMetrics(results.gcData.value);
    if (results.memoryMaxData.status === 'fulfilled') setMemoryMaxMetrics(results.memoryMaxData.value);
  }, []);

  const updateAdditionalMetrics = useCallback((
    httpTraceData: PromiseSettledResult<unknown>,
    mappingsData: PromiseSettledResult<unknown>,
    loggersData: PromiseSettledResult<unknown>,
    logFileData: PromiseSettledResult<unknown>
  ) => {
    if (httpTraceData.status === 'fulfilled') setHttpTrace(httpTraceData.value);
    if (mappingsData.status === 'fulfilled') setMappings(mappingsData.value);
    if (loggersData.status === 'fulfilled') setLoggers(loggersData.value);
    if (logFileData.status === 'fulfilled') {
      const logFileValue = logFileData.value;
      setLogFile(typeof logFileValue === 'string' ? logFileValue : String(logFileValue));
    }
  }, []);

  const updateMetricsChart = useCallback((
    memoryData: PromiseSettledResult<unknown>,
    cpuData: PromiseSettledResult<unknown>,
    threadsData: PromiseSettledResult<unknown>
  ) => {
    if (memoryData.status === 'fulfilled' && cpuData.status === 'fulfilled' && threadsData.status === 'fulfilled') {
      const memData = memoryData.value as MetricData;
      const cpuDataValue = cpuData.value as MetricData;
      const threadsDataValue = threadsData.value as MetricData;
      
      const memValue = memData?.measurements?.find((m) => m.statistic === 'VALUE')?.value || 0;
      const cpuValue = cpuDataValue?.measurements?.find((m) => m.statistic === 'VALUE')?.value || 0;
      const threadsValue = threadsDataValue?.measurements?.find((m) => m.statistic === 'VALUE')?.value || 0;
      updateMetricsHistory(memValue, cpuValue, threadsValue);
    }
  }, [updateMetricsHistory]);

  const fetchAllMetrics = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const [
        healthData,
        memoryData,
        cpuData,
        threadsData,
        httpData,
        uptimeData,
        gcData,
        memoryMaxData,
        httpTraceData,
        mappingsData,
        loggersData,
        logFileData
      ] = await Promise.allSettled([
        actuatorApi.getHealth(),
        actuatorApi.getMetric('jvm.memory.used'),
        actuatorApi.getMetric('system.cpu.usage'),
        actuatorApi.getMetric('jvm.threads.live'),
        actuatorApi.getMetric('http.server.requests'),
        actuatorApi.getMetric('process.uptime'),
        actuatorApi.getMetric('jvm.gc.pause'),
        actuatorApi.getMetric('jvm.memory.max'),
        actuatorApi.getHttpTrace(),
        actuatorApi.getMappings(),
        actuatorApi.getLoggers(),
        actuatorApi.getLogFile()
      ]);

      const essentialResults = [healthData, memoryData, cpuData];
      const allFailed = essentialResults.every(result => result.status === 'rejected');

      if (allFailed) {
        handleConnectionError(silent);
        return;
      }

      setHasConnectionError(false);
      updateBasicMetrics({
        healthData,
        memoryData,
        cpuData,
        threadsData,
        httpData,
        uptimeData,
        gcData,
        memoryMaxData
      });
      updateAdditionalMetrics(httpTraceData, mappingsData, loggersData, logFileData);
      updateMetricsChart(memoryData, cpuData, threadsData);
      
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      setAutoRefresh(false);
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron obtener las métricas del sistema';
        toast.error('Error al cargar métricas', {
          description: errorMessage
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [handleConnectionError, updateBasicMetrics, updateAdditionalMetrics, updateMetricsChart]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const startTime = Date.now();
      
      await fetchAllMetrics(true);
      toast.success('Métricas actualizadas');
      
      // Asegurar que la animación complete al menos 600ms
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 600 - elapsed);
      
      setTimeout(() => {
        setIsRefreshing(false);
      }, remaining);
    } catch {
      toast.error('Error al actualizar');
      setIsRefreshing(false);
    }
  };

  const handleLoggerUpdate = async (name: string, level: string) => {
    await actuatorApi.setLoggerLevel(name, level);
    const loggersData = await actuatorApi.getLoggers();
    setLoggers(loggersData);
  };

  // Carga inicial
  useEffect(() => {
    fetchAllMetrics();
    fetchInfo();
    fetchActiveUsers();
    fetchLiquibase();
  }, [fetchAllMetrics, fetchInfo, fetchActiveUsers, fetchLiquibase]);

  // Auto-refresh de métricas cada 10 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAllMetrics(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllMetrics]);

  // Auto-refresh de usuarios activos cada 2 minutos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchActiveUsers();
    }, 120000); // 2 minutos
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchActiveUsers]);

  return {
    loading,
    isRefreshing,
    autoRefresh,
    setAutoRefresh,
    hasConnectionError,
    health,
    info,
    memoryMetrics,
    cpuMetrics,
    threadsMetrics,
    httpMetrics,
    uptimeMetrics,
    gcMetrics,
    memoryMaxMetrics,
    httpTrace,
    mappings,
    liquibase,
    loggers,
    logFile,
    activeUsers,
    metricsHistory,
    handleRefresh,
    handleLoggerUpdate
  };
};

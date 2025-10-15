import { useState, useEffect, useCallback } from 'react';
import { actuatorApi, statsApi } from '@/core/api/api';
import { toast } from 'sonner';

interface MetricsHistory {
  time: string;
  timestamp: number;
  memory: number;
  cpu: number;
  threads: number;
}

export const useSystemMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  
  // Estados para los datos básicos de Actuator
  const [health, setHealth] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<any>(null);
  const [cpuMetrics, setCpuMetrics] = useState<any>(null);
  const [threadsMetrics, setThreadsMetrics] = useState<any>(null);
  const [httpMetrics, setHttpMetrics] = useState<any>(null);
  const [uptimeMetrics, setUptimeMetrics] = useState<any>(null);
  const [gcMetrics, setGcMetrics] = useState<any>(null);
  const [memoryMaxMetrics, setMemoryMaxMetrics] = useState<any>(null);
  
  // Estados para los nuevos endpoints
  const [httpTrace, setHttpTrace] = useState<any>(null);
  const [mappings, setMappings] = useState<any>(null);
  const [liquibase, setLiquibase] = useState<any>(null);
  const [loggers, setLoggers] = useState<any>(null);
  const [logFile, setLogFile] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<any>(null);
  
  // Historial de métricas para gráficos en tiempo real
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);

  // Actualizar historial de métricas
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
      const updated = [...prev, newDataPoint];
      // Mantener solo los últimos 30 puntos
      return updated.slice(-30);
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
        setAutoRefresh(false);
        setHasConnectionError(true);
        if (!silent) {
          toast.error('Error de autenticación', {
            description: 'Sesión expirada. Por favor recarga la página.'
          });
        }
        return;
      }

      setHasConnectionError(false);

      // Datos básicos
      if (healthData.status === 'fulfilled') setHealth(healthData.value);
      if (memoryData.status === 'fulfilled') setMemoryMetrics(memoryData.value);
      if (cpuData.status === 'fulfilled') setCpuMetrics(cpuData.value);
      if (threadsData.status === 'fulfilled') setThreadsMetrics(threadsData.value);
      if (httpData.status === 'fulfilled') setHttpMetrics(httpData.value);
      if (uptimeData.status === 'fulfilled') setUptimeMetrics(uptimeData.value);
      if (gcData.status === 'fulfilled') setGcMetrics(gcData.value);
      if (memoryMaxData.status === 'fulfilled') setMemoryMaxMetrics(memoryMaxData.value);
      
      // Nuevos datos
      if (httpTraceData.status === 'fulfilled') setHttpTrace(httpTraceData.value);
      if (mappingsData.status === 'fulfilled') setMappings(mappingsData.value);
      if (loggersData.status === 'fulfilled') setLoggers(loggersData.value);
      if (logFileData.status === 'fulfilled') setLogFile(logFileData.value);

      // Actualizar historial de gráficos
      if (memoryData.status === 'fulfilled' && cpuData.status === 'fulfilled' && threadsData.status === 'fulfilled') {
        const memValue = memoryData.value?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
        const cpuValue = cpuData.value?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
        const threadsValue = threadsData.value?.measurements?.find((m: any) => m.statistic === 'VALUE')?.value || 0;
        updateMetricsHistory(memValue, cpuValue, threadsValue);
      }
      
    } catch (error: any) {
      console.error('Error al cargar métricas:', error);
      setAutoRefresh(false);
      if (!silent) {
        toast.error('Error al cargar métricas', {
          description: error.message || 'No se pudieron obtener las métricas del sistema'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [updateMetricsHistory]);

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
    } catch (error) {
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


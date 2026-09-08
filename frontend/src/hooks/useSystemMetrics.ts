import { useState, useEffect, useCallback, useRef } from 'react';
import { actuatorApi } from '@/lib/api/system';
import { statsApi } from '@/lib/api/stats';
import { toast } from 'sonner';
import type {
  AppInfo, HealthInfo, HttpTraceInfo, LiquibaseInfo, LoggersInfo,
  MappingsInfo, MetricInfo,
} from '@/lib/types/actuator';
import type { ActiveUsersStats } from '@/lib/types/system';

// Alias (no interface) para que sea asignable a MetricsChartDataPoint, que es un
// Record indexado: las interfaces no aportan index signature implícita.
type MetricsHistory = {
  time: string;
  timestamp: number;
  memory: number;
  cpu: number;
  threads: number;
};

/** El historial vive en la sesión: al volver a Sistema los gráficos ya tienen serie. */
const HISTORY_KEY = 'usm:system:metrics-history';
const HISTORY_MAX = 360;

function leerHistorialGuardado(): MetricsHistory[] {
  try {
    const crudo = sessionStorage.getItem(HISTORY_KEY);
    if (!crudo) return [];
    const parsed: unknown = JSON.parse(crudo);
    if (!Array.isArray(parsed)) return [];
    // Una hora de historia como máximo: lo viejo no dice nada del estado actual.
    const corte = Date.now() - 60 * 60 * 1000;
    return (parsed as MetricsHistory[]).filter((p) => p?.timestamp > corte).slice(-HISTORY_MAX);
  } catch {
    return [];
  }
}

export interface PoolMetrics {
  activas: number;
  libres: number;
  maximo: number;
  esperando: number;
}

export interface TrafficMetrics {
  peticiones: number;
  demoraMediaMs: number;
  demoraMaximaMs: number;
  errores: number;
  porcentajeError: number;
}

export const useSystemMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  
  // Estados para los datos básicos de Actuator
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<MetricInfo | null>(null);
  const [cpuMetrics, setCpuMetrics] = useState<MetricInfo | null>(null);
  const [threadsMetrics, setThreadsMetrics] = useState<MetricInfo | null>(null);
  const [httpMetrics, setHttpMetrics] = useState<MetricInfo | null>(null);
  const [uptimeMetrics, setUptimeMetrics] = useState<MetricInfo | null>(null);
  const [gcMetrics, setGcMetrics] = useState<MetricInfo | null>(null);
  const [memoryMaxMetrics, setMemoryMaxMetrics] = useState<MetricInfo | null>(null);
  
  // Estados para los nuevos endpoints
  const [httpTrace, setHttpTrace] = useState<HttpTraceInfo | null>(null);
  const [mappings, setMappings] = useState<MappingsInfo | null>(null);
  const [liquibase, setLiquibase] = useState<LiquibaseInfo | null>(null);
  const [loggers, setLoggers] = useState<LoggersInfo | null>(null);
  const [logFile, setLogFile] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<ActiveUsersStats | null>(null);
  
  // Historial de métricas para gráficos en tiempo real
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>(leerHistorialGuardado);

  // Pool de conexiones (HikariCP): lo primero que se mira cuando la base va lenta.
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null);
  // Peticiones atendidas, demora media y errores: el pulso del servidor.
  const [trafficMetrics, setTrafficMetrics] = useState<TrafficMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Desde cuándo el estado de salud es el que es (dentro de esta sesión).
  const [statusSince, setStatusSince] = useState<Date | null>(null);
  const statusPrevio = useRef<string | null>(null);

  // Actualizar historial de métricas - optimizado para reducir frecuencia
  const updateMetricsHistory = useCallback((memory: number, cpu: number, threads: number) => {
    const timestamp = new Date();
    const newDataPoint: MetricsHistory = {
      time: timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: timestamp.getTime(),
      // Memoria en MB (los valores raw en bytes son ilegibles en el chart)
      memory: Math.round((memory / (1024 * 1024)) * 10) / 10,
      // CPU clamp 0-100: a veces el actuator devuelve valores >1 por mediciones
      // ruidosas y el eje Y dibuja "101%", "102%" sin sentido.
      cpu: Math.min(100, Math.max(0, cpu * 100)),
      threads,
    };

    setMetricsHistory(prev => {
      // Solo actualizar si han pasado al menos 2 segundos desde la última actualización
      const lastUpdate = prev.at(-1)?.timestamp;
      const timeDiff = timestamp.getTime() - (lastUpdate || 0);
      
      if (timeDiff < 2000 && prev.length > 0) {
        return prev; // No actualizar si es muy frecuente
      }
      
      const updated = [...prev, newDataPoint].slice(-HISTORY_MAX);
      try {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch { /* sessionStorage lleno o bloqueado: el gráfico sigue andando */ }
      return updated;
    });
  }, []);

  // Fetch de usuarios activos (separado para control de frecuencia)
  const fetchActiveUsers = useCallback(async () => {
    try {
      setActiveUsers(await statsApi.getActiveUsers());
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
    healthData: PromiseSettledResult<HealthInfo>;
    memoryData: PromiseSettledResult<MetricInfo>;
    cpuData: PromiseSettledResult<MetricInfo>;
    threadsData: PromiseSettledResult<MetricInfo>;
    httpData: PromiseSettledResult<MetricInfo>;
    uptimeData: PromiseSettledResult<MetricInfo>;
    gcData: PromiseSettledResult<MetricInfo>;
    memoryMaxData: PromiseSettledResult<MetricInfo>;
  }) => {
    if (results.healthData.status === 'fulfilled') setHealth(results.healthData.value);
    if (results.memoryData.status === 'fulfilled') setMemoryMetrics(results.memoryData.value);
    if (results.cpuData.status === 'fulfilled') setCpuMetrics(results.cpuData.value);
    if (results.threadsData.status === 'fulfilled') setThreadsMetrics(results.threadsData.value);
    if (results.httpData.status === 'fulfilled') setHttpMetrics(results.httpData.value);
    if (results.uptimeData.status === 'fulfilled') setUptimeMetrics(results.uptimeData.value);
    if (results.gcData.status === 'fulfilled') setGcMetrics(results.gcData.value);
    if (results.memoryMaxData.status === 'fulfilled') setMemoryMaxMetrics(results.memoryMaxData.value);
  }, []);

  const updateAdditionalMetrics = useCallback((
    httpTraceData: PromiseSettledResult<HttpTraceInfo>,
    mappingsData: PromiseSettledResult<MappingsInfo>,
    loggersData: PromiseSettledResult<LoggersInfo>,
    logFileData: PromiseSettledResult<string>
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
    memoryData: PromiseSettledResult<MetricInfo>,
    cpuData: PromiseSettledResult<MetricInfo>,
    threadsData: PromiseSettledResult<MetricInfo>
  ) => {
    if (memoryData.status === 'fulfilled' && cpuData.status === 'fulfilled' && threadsData.status === 'fulfilled') {
      const valorDe = (m: MetricInfo) =>
        m?.measurements?.find((x) => x.statistic === 'VALUE')?.value ?? 0;

      const memValue = valorDe(memoryData.value);
      const cpuValue = valorDe(cpuData.value);
      const threadsValue = valorDe(threadsData.value);
      updateMetricsHistory(memValue, cpuValue, threadsValue);
    }
  }, [updateMetricsHistory]);

  const valorDe = useCallback((m: MetricInfo | null | undefined, stat = 'VALUE'): number =>
    m?.measurements?.find((x) => x.statistic === stat)?.value ?? 0, []);

  const updatePoolMetrics = useCallback((
    activas: PromiseSettledResult<MetricInfo>,
    libres: PromiseSettledResult<MetricInfo>,
    maximo: PromiseSettledResult<MetricInfo>,
    esperando: PromiseSettledResult<MetricInfo>,
  ) => {
    if (activas.status !== 'fulfilled') {
      setPoolMetrics(null);
      return;
    }
    setPoolMetrics({
      activas: valorDe(activas.value),
      libres: libres.status === 'fulfilled' ? valorDe(libres.value) : 0,
      maximo: maximo.status === 'fulfilled' ? valorDe(maximo.value) : 0,
      esperando: esperando.status === 'fulfilled' ? valorDe(esperando.value) : 0,
    });
  }, [valorDe]);

  const updateTrafficMetrics = useCallback((
    httpData: PromiseSettledResult<MetricInfo>,
    erroresData: PromiseSettledResult<MetricInfo>,
  ) => {
    if (httpData.status !== 'fulfilled') {
      setTrafficMetrics(null);
      return;
    }
    const peticiones = valorDe(httpData.value, 'COUNT');
    const tiempoTotal = valorDe(httpData.value, 'TOTAL_TIME');
    const errores = erroresData.status === 'fulfilled' ? valorDe(erroresData.value, 'COUNT') : 0;
    setTrafficMetrics({
      peticiones,
      // El actuator devuelve segundos; en pantalla se lee en milisegundos.
      demoraMediaMs: peticiones > 0 ? (tiempoTotal / peticiones) * 1000 : 0,
      demoraMaximaMs: valorDe(httpData.value, 'MAX') * 1000,
      errores,
      porcentajeError: peticiones > 0 ? (errores / peticiones) * 100 : 0,
    });
  }, [valorDe]);

  const fetchAllMetrics = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Solo lo esencial para el tab Resumen/Rendimiento.
      // Los endpoints pesados (httpexchanges, mappings, loggers, logfile)
      // se cargan on-demand cuando se abre el tab correspondiente.
      const [
        healthData,
        memoryData,
        cpuData,
        threadsData,
        httpData,
        uptimeData,
        gcData,
        memoryMaxData,
      ] = await Promise.allSettled([
        actuatorApi.getHealth(),
        actuatorApi.getMetric('jvm.memory.used'),
        actuatorApi.getMetric('system.cpu.usage'),
        actuatorApi.getMetric('jvm.threads.live'),
        actuatorApi.getMetric('http.server.requests'),
        actuatorApi.getMetric('process.uptime'),
        actuatorApi.getMetric('jvm.gc.pause'),
        actuatorApi.getMetric('jvm.memory.max'),
      ]);

      // Pool y errores van aparte: si el backend no los expone, el resto sigue.
      const [poolActivas, poolLibres, poolMaximo, poolEspera, httpErrores] = await Promise.allSettled([
        actuatorApi.getMetric('hikaricp.connections.active'),
        actuatorApi.getMetric('hikaricp.connections.idle'),
        actuatorApi.getMetric('hikaricp.connections.max'),
        actuatorApi.getMetric('hikaricp.connections.pending'),
        actuatorApi.getMetric('http.server.requests?tag=outcome:SERVER_ERROR'),
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
      updateMetricsChart(memoryData, cpuData, threadsData);
      updatePoolMetrics(poolActivas, poolLibres, poolMaximo, poolEspera);
      updateTrafficMetrics(httpData, httpErrores);
      setLastUpdated(new Date());
      
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
  }, [handleConnectionError, updateBasicMetrics, updateMetricsChart, updatePoolMetrics, updateTrafficMetrics]);

  // El estado de salud rara vez cambia; cuando cambia, importa desde cuándo.
  useEffect(() => {
    const actual = health?.status;
    if (!actual) return;
    if (statusPrevio.current !== actual) {
      statusPrevio.current = actual;
      setStatusSince(new Date());
    }
  }, [health?.status]);

  // Lazy loaders por tab: cargan los endpoints pesados solo cuando se abre
  // el tab correspondiente. Idempotentes vía dedupe del API client.
  const fetchActivityData = useCallback(async () => {
    const [httpTraceData, mappingsData] = await Promise.allSettled([
      actuatorApi.getHttpTrace(),
      actuatorApi.getMappings(),
    ]);
    updateAdditionalMetrics(
      httpTraceData,
      mappingsData,
      { status: 'rejected', reason: 'not-loaded' },
      { status: 'rejected', reason: 'not-loaded' },
    );
  }, [updateAdditionalMetrics]);

  const fetchLogsData = useCallback(async () => {
    const [loggersData, logFileData] = await Promise.allSettled([
      actuatorApi.getLoggers(),
      actuatorApi.getLogFile(),
    ]);
    if (loggersData.status === 'fulfilled') setLoggers(loggersData.value);
    if (logFileData.status === 'fulfilled') {
      const v = logFileData.value;
      setLogFile(typeof v === 'string' ? v : String(v));
    }
  }, []);

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

  // Carga inicial: solo lo necesario para Resumen. Liquibase se difiere al tab DB.
  useEffect(() => {
    fetchAllMetrics();
    fetchInfo();
    fetchActiveUsers();
  }, [fetchAllMetrics, fetchInfo, fetchActiveUsers]);

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
    poolMetrics,
    trafficMetrics,
    lastUpdated,
    statusSince,
    handleRefresh,
    handleLoggerUpdate,
    fetchActivityData,
    fetchLogsData,
    fetchLiquibase,
  };
};

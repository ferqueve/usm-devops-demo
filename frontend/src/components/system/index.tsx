import { Loader2, ClipboardCopy, Download, FileDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { SystemHeader } from './SystemHeader';
import { HEADER_ACTION_ICON } from '@/components/layouts/PageHeader';
import { buildAndDownloadCsv, csvEscape, downloadBlob, todayIsoDate } from '@/lib/utils/export-helpers';
import { lazy, Suspense, useEffect, useMemo } from 'react';

const OverviewTab = lazy(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab').then(m => ({ default: m.PerformanceTab })));
const ErrorsTab = lazy(() => import('./tabs/ErrorsTab').then(m => ({ default: m.ErrorsTab })));
const DatabaseLogsTab = lazy(() => import('./tabs/DatabaseLogsTab').then(m => ({ default: m.DatabaseLogsTab })));

/** Vistas de Sistema. Cada una cuelga de Sistema en el sidebar. */
const VISTAS = ['resumen', 'rendimiento', 'errores', 'datos'] as const;
type VistaSistema = (typeof VISTAS)[number];

const ENCABEZADO: Record<VistaSistema, { titulo: string; bajada: string; acento: string }> = {
  resumen: {
    titulo: 'Sistema',
    bajada: 'Estado del servidor: salud, memoria, CPU y quién está conectado.',
    acento: '#00c7ff',
  },
  rendimiento: {
    titulo: 'Rendimiento',
    bajada: 'Memoria, CPU, hilos y recolección de basura a lo largo del tiempo.',
    acento: '#86bb4c',
  },
  errores: {
    titulo: 'Errores',
    bajada: 'Las últimas peticiones HTTP que atendió el servidor, con su código y su demora.',
    acento: '#DF2B31',
  },
  datos: {
    titulo: 'Base de datos y logs',
    bajada: 'Migraciones aplicadas, niveles de log y el archivo de log del servidor.',
    acento: '#F6CA21',
  },
};

function TabFallback({ label }: { readonly label: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Cargando {label}...</p>
      </div>
    </div>
  );
}

export default function System() {
  const {
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
    liquibase,
    loggers,
    logFile,
    activeUsers,
    metricsHistory,
    handleRefresh,
    handleLoggerUpdate,
    fetchActivityData,
    fetchLogsData,
    fetchLiquibase,
  } = useSystemMetrics();

  const [searchParams] = useSearchParams();
  const param = searchParams.get('tab') as VistaSistema | null;
  const vista: VistaSistema = param && VISTAS.includes(param) ? param : 'resumen';

  // Cada vista trae sus propios datos, y solo la primera vez que se abre.
  useEffect(() => {
    if (vista === 'errores') fetchActivityData();
    if (vista === 'datos') {
      fetchLogsData();
      fetchLiquibase();
    }
  }, [vista, fetchActivityData, fetchLogsData, fetchLiquibase]);

  /** Resumen: el estado entero al portapapeles, para pegarlo en un ticket. */
  const copiarDiagnostico = async () => {
    const diagnostico = {
      generado: new Date().toISOString(),
      estado: health?.status ?? 'desconocido',
      app: info?.build?.name ?? info?.app?.name,
      version: info?.build?.version ?? info?.app?.version,
      uptimeSegundos: uptimeMetrics?.measurements?.[0]?.value,
      memoriaUsadaBytes: memoryMetrics?.measurements?.[0]?.value,
      memoriaMaximaBytes: memoryMaxMetrics?.measurements?.[0]?.value,
      cpuProceso: cpuMetrics?.measurements?.[0]?.value,
      usuariosActivos: activeUsers?.totalActiveUsers,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostico, null, 2));
      toast.success('Diagnóstico copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar. Revisá los permisos del navegador.');
    }
  };

  /** Rendimiento: la serie que se ve en los gráficos, para analizarla afuera. */
  const exportarMetricasCsv = () => {
    if (metricsHistory.length === 0) {
      toast.error('Todavía no hay historial para exportar. Dejá la pantalla abierta un rato.');
      return;
    }
    buildAndDownloadCsv(
      ['Hora', 'Memoria (%)', 'CPU (%)', 'Hilos'],
      metricsHistory.map((m) => [csvEscape(m.time), m.memory, m.cpu, m.threads]),
      `metricas-sistema-${todayIsoDate()}.csv`,
    );
    toast.success(`${metricsHistory.length} muestras exportadas`);
  };

  /** Errores: el trace HTTP tal cual, con código y demora por petición. */
  const exportarTraceCsv = () => {
    const exchanges = httpTrace?.exchanges ?? [];
    if (exchanges.length === 0) {
      toast.error('No hay peticiones registradas para exportar');
      return;
    }
    buildAndDownloadCsv(
      ['Fecha', 'Método', 'URI', 'Estado', 'Demora', 'Usuario'],
      exchanges.map((e) => [
        csvEscape(e.timestamp),
        csvEscape(e.request?.method),
        csvEscape(e.request?.uri),
        e.response?.status ?? '',
        csvEscape(e.timeTaken),
        csvEscape(e.principal?.name),
      ]),
      `peticiones-http-${todayIsoDate()}.csv`,
    );
    toast.success(`${exchanges.length} peticiones exportadas`);
  };

  /** Datos: el log del servidor a un archivo, que es como se lee de verdad. */
  const descargarLog = () => {
    if (!logFile) {
      toast.error('El archivo de log todavía no está disponible');
      return;
    }
    downloadBlob(new Blob([logFile], { type: 'text/plain;charset=utf-8;' }), `servidor-${todayIsoDate()}.log`);
    toast.success('Log descargado');
  };

  const accionesDeVista = useMemo(() => {
    const boton = (etiqueta: string, Icono: typeof Download, onClick: () => void) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label={etiqueta}
            className={HEADER_ACTION_ICON}
          >
            <Icono className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{etiqueta}</TooltipContent>
      </Tooltip>
    );

    if (vista === 'resumen') return boton('Copiar diagnóstico', ClipboardCopy, copiarDiagnostico);
    if (vista === 'rendimiento') return boton('Exportar métricas CSV', FileDown, exportarMetricasCsv);
    if (vista === 'errores') return boton('Exportar peticiones CSV', FileDown, exportarTraceCsv);
    return boton('Descargar log', Download, descargarLog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, health, info, uptimeMetrics, memoryMetrics, memoryMaxMetrics, cpuMetrics, activeUsers, metricsHistory, httpTrace, logFile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando métricas del sistema...</p>
        </div>
      </div>
    );
  }

  const encabezado = ENCABEZADO[vista];

  return (
    <div data-page="system" className="space-y-6 max-w-full overflow-x-hidden" style={{ boxSizing: 'border-box' }}>
      <SystemHeader
        title={encabezado.titulo}
        description={encabezado.bajada}
        accentColor={encabezado.acento}
        extraActions={accionesDeVista}
        hasConnectionError={hasConnectionError}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
      />

      {vista === 'resumen' && (
        <Suspense fallback={<TabFallback label="Resumen" />}>
          <OverviewTab
            health={health}
            memoryMetrics={memoryMetrics}
            memoryMaxMetrics={memoryMaxMetrics}
            cpuMetrics={cpuMetrics}
            uptimeMetrics={uptimeMetrics}
            info={info}
            activeUsers={activeUsers}
          />
        </Suspense>
      )}

      {vista === 'rendimiento' && (
        <Suspense fallback={<TabFallback label="Rendimiento" />}>
          <PerformanceTab
            memoryMetrics={memoryMetrics}
            memoryMaxMetrics={memoryMaxMetrics}
            cpuMetrics={cpuMetrics}
            threadsMetrics={threadsMetrics}
            gcMetrics={gcMetrics}
            uptimeMetrics={uptimeMetrics}
            httpMetrics={httpMetrics}
            metricsHistory={metricsHistory}
          />
        </Suspense>
      )}

      {vista === 'errores' && (
        <Suspense fallback={<TabFallback label="Errores" />}>
          <ErrorsTab httpTrace={httpTrace} />
        </Suspense>
      )}

      {vista === 'datos' && (
        <Suspense fallback={<TabFallback label="Base de Datos y Logs" />}>
          <DatabaseLogsTab
            health={health}
            liquibase={liquibase}
            loggers={loggers}
            logFile={logFile}
            onLoggerUpdate={handleLoggerUpdate}
          />
        </Suspense>
      )}
    </div>
  );
}

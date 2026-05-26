import { Loader2, BarChart3, Activity, AlertTriangle, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { SystemHeader } from './SystemHeader';
import { lazy, Suspense, useState } from 'react';

const OverviewTab = lazy(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab').then(m => ({ default: m.PerformanceTab })));
const ErrorsTab = lazy(() => import('./tabs/ErrorsTab').then(m => ({ default: m.ErrorsTab })));
const DatabaseLogsTab = lazy(() => import('./tabs/DatabaseLogsTab').then(m => ({ default: m.DatabaseLogsTab })));

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

  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));
  const handleTabChange = (value: string) => {
    if (loadedTabs.has(value)) return;
    if (value === 'errors') fetchActivityData();
    if (value === 'database-logs') {
      fetchLogsData();
      fetchLiquibase();
    }
    setLoadedTabs(prev => new Set(prev).add(value));
  };

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

  return (
    <div data-page="system" className="space-y-6 max-w-full overflow-x-hidden" style={{ boxSizing: 'border-box' }}>
      <SystemHeader
        hasConnectionError={hasConnectionError}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
      />

      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="flex w-full mb-6 gap-1 lg:grid lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center justify-center gap-1 lg:gap-2 px-1 lg:px-3 py-2 text-sm flex-1 lg:flex-none">
            <BarChart3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center justify-center gap-1 lg:gap-2 px-1 lg:px-3 py-2 text-sm flex-1 lg:flex-none">
            <Activity className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:inline">Rendimiento</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center justify-center gap-1 lg:gap-2 px-1 lg:px-3 py-2 text-sm flex-1 lg:flex-none">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:inline">Errores</span>
          </TabsTrigger>
          <TabsTrigger value="database-logs" className="flex items-center justify-center gap-1 lg:gap-2 px-1 lg:px-3 py-2 text-sm flex-1 lg:flex-none">
            <Database className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:inline">Base de Datos y Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
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
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
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
        </TabsContent>

        <TabsContent value="errors" className="mt-0">
          <Suspense fallback={<TabFallback label="Errores" />}>
            <ErrorsTab httpTrace={httpTrace} />
          </Suspense>
        </TabsContent>

        <TabsContent value="database-logs" className="mt-0">
          <Suspense fallback={<TabFallback label="Base de Datos y Logs" />}>
            <DatabaseLogsTab
              health={health}
              liquibase={liquibase}
              loggers={loggers}
              logFile={logFile}
              onLoggerUpdate={handleLoggerUpdate}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

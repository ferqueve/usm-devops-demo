import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { SystemHeader } from './SystemHeader';
import { lazy, Suspense } from 'react';

// Lazy loading para tabs pesados
const OverviewTab = lazy(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab').then(m => ({ default: m.PerformanceTab })));
const ActivityTab = lazy(() => import('./tabs/ActivityTab').then(m => ({ default: m.ActivityTab })));
const DatabaseLogsTab = lazy(() => import('./tabs/DatabaseLogsTab').then(m => ({ default: m.DatabaseLogsTab })));

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
    mappings,
    liquibase,
    loggers,
    logFile,
    activeUsers,
    metricsHistory,
    handleRefresh,
    handleLoggerUpdate
  } = useSystemMetrics();

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
    <div data-page="system" className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-full overflow-x-hidden" style={{ boxSizing: 'border-box' }}>
      <SystemHeader
        hasConnectionError={hasConnectionError}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            ⚙️ Performance
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            🌐 Activity
          </TabsTrigger>
          <TabsTrigger value="database-logs" className="flex items-center gap-2">
            🗄️ Database & Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Cargando Overview...</p>
              </div>
            </div>
          }>
            <OverviewTab
              health={health}
              memoryMetrics={memoryMetrics}
              memoryMaxMetrics={memoryMaxMetrics}
              cpuMetrics={cpuMetrics}
              uptimeMetrics={uptimeMetrics}
              info={info}
              activeUsers={activeUsers}
              metricsHistory={metricsHistory}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Cargando Performance...</p>
              </div>
            </div>
          }>
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

        <TabsContent value="activity" className="mt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Cargando Activity...</p>
              </div>
            </div>
          }>
            <ActivityTab
              httpTrace={httpTrace}
              mappings={mappings}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="database-logs" className="mt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Cargando Database & Logs...</p>
              </div>
            </div>
          }>
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

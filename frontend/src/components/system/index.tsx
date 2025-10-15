import { Loader2 } from 'lucide-react';
import { useSystemMetrics } from '@/core/hooks/useSystemMetrics';
import { SystemHeader } from './SystemHeader';
import { SystemMetrics } from './SystemMetrics';
import { AppInfo } from './AppInfo';
import { JvmMetrics } from './JvmMetrics';
import { SystemActivity } from './SystemActivity';
import { DatabaseSection } from './DatabaseSection';
import { LogsSection } from './LogsSection';

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

      <SystemMetrics
        health={health}
        memoryMetrics={memoryMetrics}
        memoryMaxMetrics={memoryMaxMetrics}
        cpuMetrics={cpuMetrics}
        uptimeMetrics={uptimeMetrics}
      />

      <AppInfo info={info} activeUsers={activeUsers} />

      <JvmMetrics
        memoryMetrics={memoryMetrics}
        memoryMaxMetrics={memoryMaxMetrics}
        cpuMetrics={cpuMetrics}
        threadsMetrics={threadsMetrics}
        gcMetrics={gcMetrics}
        uptimeMetrics={uptimeMetrics}
        httpMetrics={httpMetrics}
        metricsHistory={metricsHistory}
      />

      <SystemActivity httpTrace={httpTrace} mappings={mappings} />

      <DatabaseSection health={health} liquibase={liquibase} />

      <LogsSection
        loggers={loggers}
        logFile={logFile}
        onLoggerUpdate={handleLoggerUpdate}
      />
    </div>
  );
}

import { memo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DatabaseSection } from '../sections/DatabaseSection';
import { LogsSection } from '../sections/LogsSection';
import type { HealthInfo, LiquibaseInfo, LoggersInfo } from '@/lib/types/actuator';

interface DatabaseLogsTabProps {
  health: HealthInfo | null | undefined;
  liquibase: LiquibaseInfo | null | undefined;
  loggers: LoggersInfo | null | undefined;
  logFile: string;
  onLoggerUpdate: (name: string, level: string) => Promise<void>;
}

export const DatabaseLogsTab = memo(function DatabaseLogsTab({
  health,
  liquibase,
  loggers,
  logFile,
  onLoggerUpdate
}: DatabaseLogsTabProps) {
  return (
    <div className="space-y-6">
      <DatabaseSection health={health} liquibase={liquibase} />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Cargando logs...</p>
            </div>
          </div>
        }
      >
        <LogsSection
          loggers={loggers}
          logFile={logFile}
          onLoggerUpdate={onLoggerUpdate}
        />
      </Suspense>
    </div>
  );
});

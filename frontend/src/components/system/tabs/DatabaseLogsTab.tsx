import { memo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DatabaseSection } from '../sections/DatabaseSection';
import { LogsSection } from '../sections/LogsSection';

interface DatabaseLogsTabProps {
  health: any;
  liquibase: any;
  loggers: any;
  logFile: string;
  onLoggerUpdate: (name: string, level: string) => Promise<void>;
}

// Lazy loading para LogsSection ya que puede ser pesado
// const LazyLogsSection = lazy(() => 
//   import('../sections/LogsSection').then(module => ({
//     default: module.LogsSection
//   }))
// );

export const DatabaseLogsTab = memo(function DatabaseLogsTab({
  health,
  liquibase,
  loggers,
  logFile,
  onLoggerUpdate
}: DatabaseLogsTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Base de Datos */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            🗄️ Base de Datos
          </span>
        </h3>
        <DatabaseSection health={health} liquibase={liquibase} />
      </section>

      {/* Logs del Sistema */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            📝 Logs del Sistema
          </span>
        </h3>
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
      </section>
    </div>
  );
});

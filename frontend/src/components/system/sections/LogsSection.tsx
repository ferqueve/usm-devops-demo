import { memo } from 'react';
import { LogViewer } from '@/components/ui/log-viewer';
import type { LoggersInfo } from '@/lib/types/actuator';

interface LogsSectionProps {
  loggers: LoggersInfo | null | undefined;
  logFile: string;
  onLoggerUpdate: (name: string, level: string) => Promise<void>;
}

export const LogsSection = memo(function LogsSection({ loggers, logFile, onLoggerUpdate }: LogsSectionProps) {
  return (
    <div>
      {/* Visor de logs con configuración integrada */}
      <LogViewer 
        content={logFile} 
        maxLines={200}
        loggers={loggers}
        onLoggerUpdate={onLoggerUpdate}
      />
    </div>
  );
});


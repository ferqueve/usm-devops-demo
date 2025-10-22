import { memo } from 'react';
import { LogViewer } from '@/components/ui/log-viewer';

interface LogsSectionProps {
  loggers: any;
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


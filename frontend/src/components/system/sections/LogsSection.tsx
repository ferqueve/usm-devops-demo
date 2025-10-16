import { memo } from 'react';
import { FileCode } from 'lucide-react';
import { LogViewer } from '@/components/ui/log-viewer';

interface LogsSectionProps {
  loggers: any;
  logFile: string;
  onLoggerUpdate: (name: string, level: string) => Promise<void>;
}

export const LogsSection = memo(function LogsSection({ loggers, logFile, onLoggerUpdate }: LogsSectionProps) {
  return (
    <section className="section-separator">
      <h3 className="section-title">
        <FileCode className="h-6 w-6 text-utec-purple" />
        Logs del Sistema
      </h3>

      {/* Visor de logs con configuración integrada */}
      <LogViewer 
        content={logFile} 
        maxLines={200}
        loggers={loggers}
        onLoggerUpdate={onLoggerUpdate}
      />
    </section>
  );
});


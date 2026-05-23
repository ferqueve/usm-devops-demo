import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Server, Info } from 'lucide-react';
import type { AppInfo } from '@/lib/types/actuator';

interface AppInfoCardProps {
  info: AppInfo | null | undefined;
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: Readonly<RowProps>) {
  return (
    <div className="flex justify-between items-center py-2 text-sm border-b last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium text-right">{children}</div>
    </div>
  );
}

export const AppInfoCard = memo(function AppInfoCard({ info }: AppInfoCardProps) {
  const app = info?.app;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-utec-dark text-white">
        <span className="w-1 h-4 rounded-sm shrink-0 bg-utec-blue" aria-hidden />
        <Server className="h-3.5 w-3.5 text-white/70 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight truncate">Información de la Aplicación</h3>
      </div>
      <div className="p-4">
        {app ? (
          <div className="space-y-0">
            <Row label="Nombre">
              <span className="text-utec-blue">{app.name}</span>
            </Row>
            <Row label="Versión">
              <Badge variant="outline">{app.version}</Badge>
            </Row>
            <Row label="Entorno">
              <Badge variant={app.environment === 'production' ? 'destructive' : 'default'}>
                {app.environment}
              </Badge>
            </Row>
            {app.description && (
              <Row label="Descripción">
                <span className="text-xs">{app.description}</span>
              </Row>
            )}
            {app['java.version'] && (
              <Row label="Java">{app['java.version']}</Row>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay información disponible</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Info } from 'lucide-react';
import type { AppInfo } from '@/lib/types/actuator';

interface AppInfoCardProps {
  info: AppInfo | null | undefined;
}

export const AppInfoCard = memo(function AppInfoCard({ info }: AppInfoCardProps) {
  return (
    <Card className="shadow-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-5 w-5 text-utec-blue" />
          Información de la Aplicación
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {info?.app ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground font-medium">Nombre:</span>
              <span className="font-semibold text-utec-blue">{info.app.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground font-medium">Versión:</span>
              <Badge variant="outline">{info.app.version}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground font-medium">Entorno:</span>
              <Badge variant={info.app.environment === 'production' ? 'destructive' : 'default'}>
                {info.app.environment}
              </Badge>
            </div>
            {info.app.description && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Descripción:</span>
                <span className="font-medium text-right text-xs">{info.app.description}</span>
              </div>
            )}
            {info.app['java.version'] && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground font-medium">Java:</span>
                <span className="font-medium">{info.app['java.version']}</span>
              </div>
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
      </CardContent>
    </Card>
  );
});

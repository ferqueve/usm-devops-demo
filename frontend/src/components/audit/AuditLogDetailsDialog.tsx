import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, User, Calendar, Database, Eye, X, Globe, Navigation, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLog } from '@/lib/types/audit';

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getAccionConfig(accion: AuditLog['accion']) {
  switch (accion) {
    case 'CREATE':
      return {
        label: 'Crear',
        color: 'bg-green-50 text-green-700 border-green-200'
      };
    case 'UPDATE':
      return {
        label: 'Actualizar',
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 'DELETE':
      return {
        label: 'Eliminar',
        color: 'bg-red-50 text-red-700 border-red-200'
      };
    default:
      return {
        label: accion,
        color: 'bg-gray-50 text-gray-700 border-gray-200'
      };
  }
}

function formatJSON(jsonString: string | null): string {
  if (!jsonString) return 'N/A';
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
}

export default function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange
}: Readonly<AuditLogDetailsDialogProps>) {
  if (!log) return null;

  const accionConfig = getAccionConfig(log.accion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Detalles del Log de Auditoría</DialogTitle>
            <Badge className={accionConfig.color}>
              {accionConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="h-4 w-4" />
                  <span>Entidad</span>
                </div>
                <p className="font-semibold">{log.entidad}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>ID Entidad</span>
                </div>
                <p className="font-semibold">{log.entidadId}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Usuario</span>
                </div>
                <p className="font-semibold">{log.usuarioNombre || 'Sistema'}</p>
                {log.usuarioEmail && (
                  <p className="text-sm text-muted-foreground">{log.usuarioEmail}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha/Hora</span>
                </div>
                <p className="font-semibold">
                  {format(new Date(log.timestamp), "PPP 'a las' HH:mm:ss", { locale: es })}
                </p>
              </div>
            </div>

            {/* Información de Request HTTP */}
            {(log.ipAddress || log.httpMethod || log.endpoint || log.userAgent) && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Información de Request HTTP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {log.ipAddress && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>Dirección IP</span>
                      </div>
                      <p className="text-sm font-mono">{log.ipAddress}</p>
                    </div>
                  )}

                  {log.httpMethod && log.endpoint && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>Endpoint</span>
                      </div>
                      <p className="text-sm font-mono">
                        <Badge variant="outline" className="mr-2 font-mono text-xs">{log.httpMethod}</Badge>
                        {log.endpoint}
                      </p>
                    </div>
                  )}

                  {log.userAgent && (
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        <span>User-Agent</span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate" title={log.userAgent}>
                        {log.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Datos previos */}
            {log.datosPrevios && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Datos Previos
                </h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {formatJSON(log.datosPrevios)}
                  </pre>
                </div>
              </div>
            )}

            {/* Datos nuevos */}
            {log.datosNuevos && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Datos Nuevos
                </h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {formatJSON(log.datosNuevos)}
                  </pre>
                </div>
              </div>
            )}

            {/* Comparación si hay ambos */}
            {log.datosPrevios && log.datosNuevos && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Comparación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-2 text-red-600">Datos Previos</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {formatJSON(log.datosPrevios)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2 text-green-600">Datos Nuevos</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {formatJSON(log.datosNuevos)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


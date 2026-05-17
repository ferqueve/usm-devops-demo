import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Clock, User, GraduationCap, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { Reserva } from '@/lib/types/spaces';
import { useState } from 'react';

interface ReservationDetailsDialogProps {
  reserva: Reserva;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReservaUpdated?: () => void;
}

function getEstadoConfig(estado: Reserva['estado']) {
  switch (estado) {
    case 'APROBADO':
      return {
        label: 'Aprobada',
        color: 'bg-green-50 text-green-700 border-green-200'
      };
    case 'PENDIENTE':
      return {
        label: 'Pendiente',
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    case 'CANCELADO':
      return {
        label: 'Cancelada',
        color: 'bg-red-50 text-red-700 border-red-200'
      };
    default:
      return {
        label: estado,
        color: 'bg-gray-50 text-gray-700 border-gray-200'
      };
  }
}

export default function ReservationDetailsDialog({
  reserva,
  open,
  onOpenChange,
  onReservaUpdated
}: Readonly<ReservationDetailsDialogProps>) {
  const { hasPermission } = useRolePermissions();
  // Usuarios que necesitan aprobación (DOCENTE/EXTERNO) pueden ver el motivo de solicitud
  const puedeVerMotivoSolicitud = !hasPermission('reserva:aprobar');
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [mensajeAnalista, setMensajeAnalista] = useState('');
  const [loading, setLoading] = useState(false);

  const estadoConfig = getEstadoConfig(reserva.estado);
  const esFutura = new Date(reserva.inicio) > new Date();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const duracionHoras = Math.round((new Date(reserva.fin).getTime() - new Date(reserva.inicio).getTime()) / (1000 * 60 * 60) * 10) / 10;

  const handleAprobarClick = () => {
    setMensajeAnalista('');
    setShowAprobarDialog(true);
  };

  const handleAprobarReserva = async () => {
    try {
      setLoading(true);
      const response = await reservationsApi.cambiarEstadoReserva(
        reserva.id,
        'APROBADO',
        mensajeAnalista.trim() || undefined
      );
      if (response.data) {
        toast.success('Reserva aprobada', {
          description: `La reserva de ${reserva.espacioNombre} ha sido aprobada exitosamente.`
        });
        if (onReservaUpdated) {
          onReservaUpdated();
        }
        setShowAprobarDialog(false);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo aprobar la reserva';
      toast.error('Error al aprobar reserva', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRechazarClick = () => {
    setMensajeAnalista('');
    setShowRechazarDialog(true);
  };

  const handleRechazarReserva = async () => {
    try {
      setLoading(true);
      const response = await reservationsApi.cambiarEstadoReserva(
        reserva.id,
        'CANCELADO',
        mensajeAnalista.trim() || undefined
      );
      if (response.data) {
        toast.success('Reserva rechazada', {
          description: `La reserva de ${reserva.espacioNombre} ha sido rechazada.`
        });
        if (onReservaUpdated) {
          onReservaUpdated();
        }
        setShowRechazarDialog(false);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo rechazar la reserva';
      toast.error('Error al rechazar reserva', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[520px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                {reserva.titulo || reserva.espacioNombre}
              </DialogTitle>
              {reserva.titulo && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {reserva.espacioNombre}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant="outline" className={estadoConfig.color}>
                {estadoConfig.label}
              </Badge>
              <span className="text-[11px] text-muted-foreground">#{reserva.id}</span>
            </div>
          </div>
          {reserva.esPublica && (
            <Badge variant="outline" className="mt-2 self-start text-xs">
              Externa
            </Badge>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Información principal en filas */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Fecha
                </dt>
                <dd className="mt-0.5 font-medium">{formatDate(reserva.inicio)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Horario
                </dt>
                <dd className="mt-0.5 font-medium">
                  {formatTime(reserva.inicio)} – {formatTime(reserva.fin)}
                  <span className="text-muted-foreground font-normal"> · {duracionHoras}h</span>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Capacidad
                </dt>
                <dd className="mt-0.5 font-medium">{reserva.capacidadEspacio} personas</dd>
              </div>
              {reserva.carreraId && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Carrera
                  </dt>
                  <dd className="mt-0.5 font-medium flex items-center gap-1.5">
                    <span className="truncate">{reserva.carreraNombre}</span>
                    {reserva.carreraCodigo && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 flex-shrink-0">
                        {reserva.carreraCodigo}
                      </Badge>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {/* Reservado por */}
            <div className="pt-3 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Reservado por
              </div>
              <div className="mt-0.5">
                <p className="font-medium text-sm">{reserva.usuarioNombre}</p>
                <p className="text-xs text-muted-foreground">{reserva.usuarioEmail}</p>
              </div>
            </div>

            {/* Motivo de solicitud (solo docentes/externos) */}
            {puedeVerMotivoSolicitud && reserva.motivoSolicitud && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">Motivo de la solicitud</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{reserva.motivoSolicitud}</p>
              </div>
            )}

            {/* Mensaje del analista */}
            {reserva.mensajeAnalista && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Mensaje del analista
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{reserva.mensajeAnalista}</p>
              </div>
            )}

            {/* Aviso si ya pasó */}
            {!esFutura && reserva.estado === 'APROBADO' && (
              <p className="pt-3 border-t text-xs text-muted-foreground italic">
                Reserva completada.
              </p>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-3 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {reserva.estado === 'PENDIENTE' && (
            <PermissionGuard requiredPermission="reserva:aprobar" fallback={null} showFallback={false}>
              <Button
                variant="outline"
                onClick={handleRechazarClick}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Rechazar
              </Button>
              <Button
                onClick={handleAprobarClick}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Aprobar
              </Button>
            </PermissionGuard>
          )}
        </div>
      </DialogContent>

      {/* Diálogo de confirmación para aprobar con mensaje opcional */}
      <AlertDialog open={showAprobarDialog} onOpenChange={setShowAprobarDialog}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar esta reserva? Puedes agregar un mensaje opcional.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="mensaje-aprobar">Mensaje (Opcional)</Label>
              <Textarea
                id="mensaje-aprobar"
                placeholder="Mensaje opcional para el solicitante..."
                value={mensajeAnalista}
                onChange={(e) => setMensajeAnalista(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Este mensaje será visible para el solicitante de la reserva.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAprobarDialog(false)} disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAprobarReserva}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Aprobando...' : 'Aprobar Reserva'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para rechazar con mensaje opcional */}
      <AlertDialog open={showRechazarDialog} onOpenChange={setShowRechazarDialog}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas rechazar esta reserva? Puedes agregar un mensaje opcional explicando el motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="mensaje-rechazar">Mensaje (Opcional)</Label>
              <Textarea
                id="mensaje-rechazar"
                placeholder="Explica el motivo del rechazo..."
                value={mensajeAnalista}
                onChange={(e) => setMensajeAnalista(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Este mensaje será visible para el solicitante de la reserva.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRechazarDialog(false)} disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRechazarReserva}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Rechazando...' : 'Rechazar Reserva'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}


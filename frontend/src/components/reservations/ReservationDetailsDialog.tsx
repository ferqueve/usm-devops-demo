import {
  Dialog,
  DialogContent,
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
import { MapPin, Users, Calendar, Clock, User, GraduationCap, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';
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
}: ReservationDetailsDialogProps) {
  const { user } = useAuth();
  // Verificar si el usuario es analista o admin (no deben ver el motivo de solicitud)
  const isAnalista = user?.rol === ROLES.ANALISTA || user?.rol === ROLES.ADMIN;
  const puedeVerMotivoSolicitud = !isAnalista; // Solo docentes y externos pueden ver el motivo
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
      <DialogContent className="!grid-cols-1 w-[95vw] sm:max-w-[500px] !p-0 !gap-0 max-h-[85vh] !flex !flex-col overflow-hidden">
        {/* Ticket Style Header */}
        <div className={`relative ${estadoConfig.color} px-5 pt-4 pb-3 flex-shrink-0`}>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium opacity-70">RESERVA #{reserva.id}</p>
            <Badge className="bg-white/90 text-gray-900 border-0 font-semibold shadow-sm flex-shrink-0">
              {estadoConfig.label}
            </Badge>
            {reserva.esPublica && (
              <Badge className="bg-white/90 text-blue-700 border-0 font-semibold shadow-sm flex-shrink-0">
                Externa
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg font-bold truncate">{reserva.titulo || reserva.espacioNombre}</DialogTitle>
          {reserva.titulo && reserva.espacioNombre && (
            <p className="text-sm text-white/80 truncate mt-1">{reserva.espacioNombre}</p>
          )}
          {/* Puntos decorativos tipo ticket */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
            <div className="w-3 h-3 bg-white rounded-full -mb-1.5"></div>
          </div>
        </div>

        {/* Contenido del ticket */}
        <div className="bg-white flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Imagen del espacio - sin padding */}
          <div className="relative w-full mt-3">
            <div className="h-28 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {reserva.espacioImagen ? (
                <img
                  src={reserva.espacioImagen}
                  alt={reserva.espacioNombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-14 w-14 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Línea punteada tipo ticket */}
          <div className="border-t border-dashed border-gray-300 w-full mt-3"></div>

          {/* Contenedor con padding para el contenido */}
          <div className="px-5 py-3 space-y-2.5">
            {/* Título */}
            {reserva.titulo && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-800">Título</p>
                <p className="text-sm text-blue-900 font-medium">{reserva.titulo}</p>
              </div>
            )}

            {/* Motivo de solicitud - Solo visible para docentes/externos, NO para analistas/admin */}
            {puedeVerMotivoSolicitud && reserva.motivoSolicitud && (
              <div className="bg-gray-50 border-l-4 border-gray-400 rounded p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-800">Motivo de la solicitud</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{reserva.motivoSolicitud}</p>
              </div>
            )}

            {/* Información en grid compacto */}
            <div className="grid grid-cols-2 gap-2">
              {/* Fecha */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-0.5">Fecha</p>
                  <p className="text-xs font-semibold truncate leading-tight">{formatDate(reserva.inicio)}</p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-0.5">Horario</p>
                  <p className="text-xs font-semibold truncate leading-tight">{formatTime(reserva.inicio)} - {formatTime(reserva.fin)}</p>
                </div>
              </div>

              {/* Capacidad */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                  <Users className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-0.5">Capacidad</p>
                  <p className="text-xs font-semibold truncate leading-tight">{reserva.capacidadEspacio} personas</p>
                </div>
              </div>

              {/* Duración */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-orange-100 rounded-lg flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-0.5">Duración</p>
                  <p className="text-xs font-semibold truncate leading-tight">{duracionHoras}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Línea punteada - fuera del contenedor con padding */}
          <div className="border-t border-dashed border-gray-300 w-full"></div>

          {/* Contenedor con padding para usuario y carrera */}
          <div className="px-5 py-3 space-y-2.5">
            {/* Usuario y Carrera */}
            <div className="grid grid-cols-2 gap-2">
              {/* Usuario */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-0.5">Reservado por</p>
                  <p className="text-xs font-semibold truncate leading-tight">{reserva.usuarioNombre}</p>
                  <p className="text-[10px] text-gray-400 truncate leading-tight">{reserva.usuarioEmail}</p>
                </div>
              </div>

              {/* Carrera */}
              {reserva.carreraId ? (
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 mb-0.5">Carrera</p>
                    <p className="text-xs font-semibold truncate leading-tight">{reserva.carreraNombre}</p>
                    {reserva.carreraCodigo && (
                      <Badge variant="outline" className="mt-0.5 text-[10px] py-0 h-4 px-1.5">
                        {reserva.carreraCodigo}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>

            {/* Alerta si ya pasó */}
            {!esFutura && reserva.estado === 'APROBADO' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                <p className="text-[10px] text-blue-700">Reserva completada</p>
              </div>
            )}

            {/* Mensaje del analista si existe */}
            {reserva.mensajeAnalista && (
              <div className={`border-l-4 rounded p-3 space-y-2 ${reserva.estado === 'CANCELADO'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-green-50 border-green-400'
                }`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-4 w-4 flex-shrink-0 ${reserva.estado === 'CANCELADO' ? 'text-red-600' : 'text-green-600'
                    }`} />
                  <p className={`text-xs font-semibold ${reserva.estado === 'CANCELADO' ? 'text-red-800' : 'text-green-800'
                    }`}>
                    {reserva.estado === 'CANCELADO' ? 'Mensaje del analista' : 'Mensaje del analista'}
                  </p>
                </div>
                <p className={`text-xs whitespace-pre-wrap ${reserva.estado === 'CANCELADO' ? 'text-red-700' : 'text-green-700'
                  }`}>
                  {reserva.mensajeAnalista}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer tipo ticket */}
        <div className="relative bg-gray-50 px-5 py-2.5 border-t border-dashed border-gray-300 flex-shrink-0">
          {/* Puntos decorativos inferiores */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -mt-1.5">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>

          {/* Botones de acción para reservas pendientes */}
          {reserva.estado === 'PENDIENTE' && (
            <PermissionGuard requiredPermission="reservas:aprobar" fallback={null} showFallback={false}>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Button
                  variant="default"
                  onClick={handleAprobarClick}
                  className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar Reserva
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRechazarClick}
                  className="flex-1 h-9 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </PermissionGuard>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-9 text-sm">
            Cerrar
          </Button>
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


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar, Clock, User, Mail } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';

interface ReservationDetailsDialogProps {
  reserva: Reserva;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
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
  onOpenChange
}: ReservationDetailsDialogProps) {
  const estadoConfig = getEstadoConfig(reserva.estado);
  const esFutura = new Date(reserva.inicio) > new Date();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalles de la Reserva
            <Badge className={`${estadoConfig.color} border font-medium`}>
              {estadoConfig.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Información completa de la reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Imagen del espacio */}
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            {reserva.espacioImagen ? (
              <img
                src={reserva.espacioImagen}
                alt={reserva.espacioNombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Información del espacio */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Información del Espacio</h3>
            <div className="grid gap-2 pl-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Nombre:</span>
                <span className="break-words">{reserva.espacioNombre}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Capacidad:</span>
                <span>{reserva.capacidadEspacio} personas</span>
              </div>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Información del Usuario</h3>
            <div className="grid gap-2 pl-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Nombre:</span>
                <span className="break-words">{reserva.usuarioNombre}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Email:</span>
                <span className="break-all">{reserva.usuarioEmail}</span>
              </div>
            </div>
          </div>

          {/* Información de fecha y hora */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Fecha y Hora</h3>
            <div className="grid gap-2 pl-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Fecha:</span>
                <span className="break-words">{formatDate(reserva.inicio)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Horario:</span>
                <span>{formatTime(reserva.inicio)} - {formatTime(reserva.fin)}</span>
              </div>
            </div>
          </div>

          {/* Alerta si ya pasó */}
          {!esFutura && reserva.estado === 'APROBADO' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Esta reserva ya completó su horario programado.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


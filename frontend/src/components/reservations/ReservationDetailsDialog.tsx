import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar, Clock, User, GraduationCap } from 'lucide-react';
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
          </div>
          <DialogTitle className="text-lg font-bold truncate">{reserva.espacioNombre}</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-9 text-sm">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


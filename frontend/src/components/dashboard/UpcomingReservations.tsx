import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Reserva } from '@/lib/types/spaces';
import { useNavigate } from 'react-router-dom';

interface UpcomingReservationsProps {
  reservas: Reserva[];
  loading?: boolean;
  onViewDetails?: (reserva: Reserva) => void;
  showMyReservationsOnly?: boolean;
  onToggleFilter?: () => void;
}

export default function UpcomingReservations({ 
  reservas, 
  loading = false,
  onViewDetails,
  showMyReservationsOnly = false,
  onToggleFilter
}: Readonly<UpcomingReservationsProps>) {
  const navigate = useNavigate();

  const handleViewDetails = (reserva: Reserva) => {
    if (onViewDetails) {
      onViewDetails(reserva);
    } else {
      // Navegar a la página de reservas o mostrar detalles
      navigate(`/reservations`);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Próximas Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 w-48 bg-secondary rounded mb-2" />
                  <div className="h-3 w-64 bg-secondary rounded" />
                </div>
                <div className="h-8 w-24 bg-secondary rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservas.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximas Reservas</CardTitle>
          {onToggleFilter && (
            <Button variant="outline" size="sm" onClick={onToggleFilter}>
              {showMyReservationsOnly ? 'Ver todas' : 'Ver mis reservas'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay reservas próximas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Próximas Reservas</CardTitle>
        {onToggleFilter && (
          <Button variant="outline" size="sm" onClick={onToggleFilter}>
            {showMyReservationsOnly ? 'Ver todas' : 'Ver mis reservas'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservas.slice(0, 10).map((reserva) => {
            const fechaInicio = new Date(reserva.inicio);
            const fechaFin = new Date(reserva.fin);
            const duracion = Math.round((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60));

            return (
              <div
                key={reserva.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{reserva.espacioNombre}</h4>
                    {getEstadoBadge(reserva.estado)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(fechaInicio, "d MMM yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {format(fechaInicio, "HH:mm", { locale: es })} - {format(fechaFin, "HH:mm", { locale: es })}
                      </span>
                      <span className="ml-1">({duracion} min)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{reserva.espacioNombre}</span>
                    </div>
                    {!!reserva.capacidadEspacio && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>Capacidad: {reserva.capacidadEspacio}</span>
                      </div>
                    )}
                  </div>
                  {reserva.usuarioNombre && (
                    <p className="text-xs text-muted-foreground">
                      Reservado por: {reserva.usuarioNombre}
                      {reserva.carreraNombre && ` • ${reserva.carreraNombre}`}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(reserva)}
                  className="ml-4"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalles
                </Button>
              </div>
            );
          })}
        </div>
        {reservas.length > 10 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reservations')}
            >
              Ver todas las reservas ({reservas.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


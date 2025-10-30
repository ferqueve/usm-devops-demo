import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Plus, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import type { Reserva } from '@/lib/types/spaces';
import ReservationFormDialog from './ReservationFormDialog.tsx';
import ReservationDetailsDialog from './ReservationDetailsDialog.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getEstadoConfig(estado: Reserva['estado']) {
  switch (estado) {
    case 'APROBADO':
      return {
        label: 'Aprobada',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: '✓'
      };
    case 'PENDIENTE':
      return {
        label: 'Pendiente',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: '⏳'
      };
    case 'CANCELADO':
      return {
        label: 'Cancelada',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: '✕'
      };
    default:
      return {
        label: estado,
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: '?'
      };
  }
}

export default function ReservationManagement() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('todas');
  const [createDialog, setCreateDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await reservationsApi.obtenerMisReservas();
      if (response.data) {
        // Ordenar por fecha descendente
        const sorted = response.data.sort((a, b) => 
          new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
        );
        setReservas(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar reservas', {
        description: error.message || 'No se pudieron cargar las reservas'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchReservas();
    toast.success('Reserva creada exitosamente');
  };

  const handleCancelReserva = async (reserva: Reserva) => {
    try {
      await reservationsApi.cancelarReserva(reserva.id);
      toast.success('Reserva cancelada exitosamente');
      fetchReservas();
    } catch (error: any) {
      toast.error('Error al cancelar reserva', {
        description: error.message || 'No se pudo cancelar la reserva'
      });
    }
  };

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  // Filtrar reservas por estado
  const reservasFiltradas = reservas.filter(reserva => {
    if (estadoFilter === 'todas') return true;
    return reserva.estado === estadoFilter;
  });

  // Separar futuras y pasadas
  const ahora = new Date();
  const futuras = reservasFiltradas.filter(r => new Date(r.inicio) > ahora);
  const pasadas = reservasFiltradas.filter(r => new Date(r.inicio) <= ahora);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mis Reservas</h2>
          <p className="text-muted-foreground">
            Administra tus reservas de espacios
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="APROBADO">Aprobadas</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="CANCELADO">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{futuras.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pasadas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de reservas */}
      {reservasFiltradas.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay reservas"
          description="No tienes reservas con los filtros seleccionados"
          action={{
            label: 'Crear reserva',
            onClick: () => setCreateDialog(true)
          }}
        />
      ) : (
        <>
          {/* Reservas futuras */}
          {futuras.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {futuras.map((reserva) => {
                    const estadoConfig = getEstadoConfig(reserva.estado);
                    const esFutura = new Date(reserva.inicio) > new Date();
                    return (
                      <div key={reserva.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          {reserva.espacioImagen ? (
                            <img
                              src={reserva.espacioImagen}
                              alt={reserva.espacioNombre}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <MapPin className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{reserva.espacioNombre}</h3>
                              <Badge className={`${estadoConfig.color} border font-medium`}>
                                {estadoConfig.label}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(reserva.inicio)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(reserva.inicio)} - {formatTime(reserva.fin)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Capacidad: {reserva.capacidadEspacio}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(reserva)}>
                            Ver
                          </Button>
                          {esFutura && reserva.estado === 'APROBADO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelReserva(reserva)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reservas pasadas */}
          {pasadas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reservas Pasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pasadas.map((reserva) => {
                    const estadoConfig = getEstadoConfig(reserva.estado);
                    return (
                      <div key={reserva.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          {reserva.espacioImagen ? (
                            <img
                              src={reserva.espacioImagen}
                              alt={reserva.espacioNombre}
                              className="w-16 h-16 rounded-lg object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center opacity-60">
                              <MapPin className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-muted-foreground">{reserva.espacioNombre}</h3>
                              <Badge className={`${estadoConfig.color} border font-medium`}>
                                {estadoConfig.label}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(reserva.inicio)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(reserva.inicio)} - {formatTime(reserva.fin)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(reserva)}>
                          Ver
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modales */}
      <ReservationFormDialog
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
        />
      )}
    </div>
  );
}


import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import type { Reserva } from '@/lib/types/spaces';
import { reservationsApi } from '@/lib/api/reservations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Calendar, AlertCircle, Plus, Clock, Eye, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ExternoDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [misSolicitudes, setMisSolicitudes] = useState<Reserva[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Reserva[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboardExterno();
        setData(dashboardData);
        
        // Cargar todas las reservas para gráficos (solo lectura)
        try {
          const todasReservas = await reservationsApi.obtenerTodasLasReservas();
          if (todasReservas.data) {
            setAllReservas(todasReservas.data);
          }
        } catch (error) {
          console.warn('No se pudieron cargar todas las reservas para gráficos:', error);
        }

        // Cargar mis solicitudes
        try {
          const misReservas = await reservationsApi.obtenerMisReservas();
          if (misReservas.data) {
            setMisSolicitudes(misReservas.data);
            // Filtrar solicitudes pendientes
            const pendientes = misReservas.data.filter(r => r.estado === 'PENDIENTE');
            setSolicitudesPendientes(pendientes);
          }
        } catch (error) {
          console.warn('No se pudieron cargar mis solicitudes:', error);
        }
      } catch (error: unknown) {
        console.error('Error al cargar datos del dashboard:', error);
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
        toast.error('Error al cargar el dashboard', {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  // Obtener últimas reservas públicas (las más recientes)
  const ultimasReservasPublicas = useMemo(() => {
    if (!data?.proximasReservas) return [];
    const ahora = new Date();
    return data.proximasReservas
      .filter(r => {
        const inicio = new Date(r.inicio);
        return inicio <= ahora; // Reservas pasadas o actuales
      })
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
      .slice(0, 5);
  }, [data?.proximasReservas]);

  // Reservas de interés (próximas reservas públicas aprobadas)
  const reservasDeInteres = useMemo(() => {
    if (!data?.proximasReservas) return [];
    const ahora = new Date();
    return data.proximasReservas
      .filter(r => {
        const inicio = new Date(r.inicio);
        return inicio > ahora && r.estado === 'APROBADO';
      })
      .slice(0, 5);
  }, [data?.proximasReservas]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visualización de eventos públicos y gestión de tus solicitudes de reserva
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {!loading && solicitudesPendientes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Tienes {solicitudesPendientes.length} solicitud{solicitudesPendientes.length > 1 ? 'es' : ''} pendiente{solicitudesPendientes.length > 1 ? 's' : ''} de aprobación
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Esperando aprobación del analista
                  </p>
                </div>
              </div>
              <Link to="/reservations">
                <Button variant="outline" size="sm">
                  Ver detalles
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas principales */}
      <DashboardStats 
        stats={data?.stats || {
          totalReservas: 0,
          reservasHoy: 0,
          reservasPendientes: 0,
          reservasAprobadas: 0,
          reservasCanceladas: 0,
          totalEspacios: 0,
          espaciosDisponibles: 0,
          espaciosOcupados: 0,
          espaciosEnMantenimiento: 0,
          capacidadPromedio: 0,
          totalUsuarios: 0,
          usuariosActivos: 0,
          usuariosNuevosHoy: 0,
          ocupacionPromedio: 0
        }}
        loading={loading}
      />

      {/* Contenido principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Reservas de Interés (Próximas reservas públicas) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Reservas de Interés</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Próximos eventos públicos de la universidad
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-64 bg-gray-200 rounded" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : reservasDeInteres.length > 0 ? (
              <div className="space-y-4">
                {reservasDeInteres.map((reserva) => {
                  const fechaInicio = new Date(reserva.inicio);
                  const fechaFin = new Date(reserva.fin);
                  const duracion = Math.round((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60));

                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                          {reserva.capacidadEspacio && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>Capacidad: {reserva.capacidadEspacio}</span>
                            </div>
                          )}
                        </div>
                        {reserva.usuarioNombre && (
                          <p className="text-xs text-muted-foreground">
                            Organizado por: {reserva.usuarioNombre}
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay reservas públicas próximas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tus Reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Tus Reservas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tus solicitudes de reserva
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : misSolicitudes.length > 0 ? (
              <div className="space-y-3">
                {misSolicitudes.slice(0, 5).map((reserva) => {
                  const fechaInicio = new Date(reserva.inicio);
                  return (
                    <div
                      key={reserva.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(reserva)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{reserva.espacioNombre}</h4>
                        {getEstadoBadge(reserva.estado)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(fechaInicio, "d MMM yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(fechaInicio, "HH:mm", { locale: es })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {misSolicitudes.length > 5 && (
                  <Link to="/reservations">
                    <Button variant="ghost" size="sm" className="w-full">
                      Ver todas ({misSolicitudes.length})
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No tienes reservas aún</p>
                <Link to="/calendar" className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Reserva
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Reservas Públicas */}
      {!loading && ultimasReservasPublicas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Reservas Públicas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Eventos públicos recientes de la universidad
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimasReservasPublicas.map((reserva) => {
                const fechaInicio = new Date(reserva.inicio);
                const fechaFin = new Date(reserva.fin);
                const duracion = Math.round((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60));

                return (
                  <div
                    key={reserva.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                        </div>
                        {reserva.usuarioNombre && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{reserva.usuarioNombre}</span>
                          </div>
                        )}
                      </div>
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
          </CardContent>
        </Card>
      )}

      {/* Acciones rápidas */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/calendar" className="block">
                <Button className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Reserva
                </Button>
              </Link>
              <Link to="/calendar" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Calendario Público
                </Button>
              </Link>
              {misSolicitudes.length > 0 && (
                <Link to="/reservations" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Mis Solicitudes ({misSolicitudes.length})
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos - Solo reservas públicas */}
      {!loading && allReservas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Estadísticas de Reservas Públicas</h3>
          <DashboardCharts 
            reservas={allReservas}
            loading={loading}
          />
        </div>
      )}

      {/* Diálogo de detalles */}
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


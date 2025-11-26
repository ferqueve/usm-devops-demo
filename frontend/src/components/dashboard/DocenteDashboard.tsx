import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import QuickActions from './QuickActions';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import type { Reserva } from '@/lib/types/spaces';
import { reservationsApi } from '@/lib/api/reservations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useRecomendacionesDashboard } from '@/hooks/useRecomendaciones';
import { useNavigate } from 'react-router-dom';

export default function DocenteDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [myReservas, setMyReservas] = useState<Reserva[]>([]);
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const { recomendaciones, loading: loadingRecomendaciones } = useRecomendacionesDashboard();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboardDocente();
        setData(dashboardData);
        
        // Cargar mis reservas
        try {
          const misReservas = await reservationsApi.obtenerMisReservas();
          if (misReservas.data) {
            setMyReservas(misReservas.data);
            // Filtrar reservas pendientes
            const pendientes = misReservas.data.filter(r => r.estado === 'PENDIENTE');
            setReservasPendientes(pendientes);
          }
        } catch (error) {
          console.warn('No se pudieron cargar mis reservas:', error);
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

  // Filtrar mis próximas reservas
  const misProximasReservas = myReservas
    .filter(r => {
      const inicio = new Date(r.inicio);
      return inicio > new Date() && r.estado === 'APROBADO';
    })
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Mi Dashboard</h2>
          <p className="text-muted-foreground">
            Tus reservas y actividades
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {!loading && reservasPendientes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Tienes {reservasPendientes.length} solicitud{reservasPendientes.length > 1 ? 'es' : ''} pendiente{reservasPendientes.length > 1 ? 's' : ''} de aprobación
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

      {/* Recomendaciones */}
      {!loadingRecomendaciones && recomendaciones && (
        (recomendaciones.espaciosRecomendados && recomendaciones.espaciosRecomendados.length > 0) ||
        (recomendaciones.itemsRecomendados && recomendaciones.itemsRecomendados.length > 0)
      ) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Recomendaciones para Ti</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recomendaciones.espaciosRecomendados && recomendaciones.espaciosRecomendados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Espacios Recomendados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recomendaciones.espaciosRecomendados.slice(0, 4).map((rec) => (
                      <Card
                        key={rec.espacioId}
                        className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
                        onClick={() => navigate(`/rooms/${rec.espacioId}`)}
                        style={{
                          borderTop: rec.tipoEspacioColor ? `4px solid ${rec.tipoEspacioColor}` : undefined,
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{rec.espacioNombre}</h4>
                              {rec.tipoEspacioNombre && (
                                <span className="text-xs text-muted-foreground">{rec.tipoEspacioNombre}</span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-primary">
                              {(rec.puntaje * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{rec.razon}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {recomendaciones.itemsRecomendados && recomendaciones.itemsRecomendados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Items Recomendados</h3>
                  <div className="space-y-2">
                    {recomendaciones.itemsRecomendados.slice(0, 3).map((rec) => (
                      <div
                        key={rec.tipoElementoId}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rec.tipoElementoNombre}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{rec.razon}</p>
                        </div>
                        <span className="text-xs font-medium text-primary ml-2">
                          {(rec.puntaje * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Mis próximas reservas */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis Próximas Reservas</CardTitle>
            <Link to="/reservations">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
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
                  </div>
                ))}
              </div>
            ) : misProximasReservas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes reservas próximas</p>
                <Link to="/reservations" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Solicitar reserva
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {misProximasReservas.map((reserva) => {
                  const fechaInicio = new Date(reserva.inicio);
                  const fechaFin = new Date(reserva.fin);
                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{reserva.espacioNombre}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{fechaInicio.toLocaleDateString('es-ES', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {fechaInicio.toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {fechaFin.toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(reserva)}
                        className="ml-4"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de mis reservas */}
        {!loading && data && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de Mis Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas activas</span>
                  <span className="text-sm font-medium text-green-600">
                    {data.stats.reservasAprobadas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendientes</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {data.stats.reservasPendientes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas hoy</span>
                  <span className="text-sm font-medium text-purple-600">
                    {data.stats.reservasHoy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total reservas</span>
                  <span className="text-sm font-medium">
                    {data.stats.totalReservas}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráficos de mis reservas */}
      {!loading && myReservas.length > 0 && (
        <DashboardCharts 
          reservas={myReservas}
          loading={loading}
        />
      )}

      {/* Acciones rápidas */}
      <QuickActions />

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


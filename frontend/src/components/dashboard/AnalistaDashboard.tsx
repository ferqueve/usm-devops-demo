import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import DashboardStats from './DashboardStats';
import UpcomingReservations from './UpcomingReservations';
import DashboardCharts from './DashboardCharts';
import QuickActions from './QuickActions';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import type { Reserva } from '@/lib/types/spaces';
import { reservationsApi } from '@/lib/api/reservations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';

export default function AnalistaDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [reservasPrioritarias, setReservasPrioritarias] = useState<RecomendacionAnalista[]>([]);
  const [loadingPrioritarias, setLoadingPrioritarias] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboardAnalista();
        setData(dashboardData);
        
        // Cargar todas las reservas para gráficos
        try {
          const todasReservas = await reservationsApi.obtenerTodasLasReservas();
          if (todasReservas.data) {
            setAllReservas(todasReservas.data);
            // Filtrar reservas pendientes
            const pendientes = todasReservas.data.filter(r => r.estado === 'PENDIENTE');
            setReservasPendientes(pendientes);
          }
        } catch (error) {
          console.warn('No se pudieron cargar todas las reservas para gráficos:', error);
        }

        // Cargar reservas prioritarias
        try {
          setLoadingPrioritarias(true);
          const prioritarias = await recomendacionesApi.obtenerReservasPrioritarias();
          if (prioritarias.success && prioritarias.data) {
            setReservasPrioritarias(prioritarias.data);
          }
        } catch (error) {
          console.warn('No se pudieron cargar reservas prioritarias:', error);
        } finally {
          setLoadingPrioritarias(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Analista</h2>
          <p className="text-muted-foreground">
            Gestión de reservas y seguimiento del sistema
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {!loading && data && reservasPendientes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Tienes {reservasPendientes.length} reserva{reservasPendientes.length > 1 ? 's' : ''} pendiente{reservasPendientes.length > 1 ? 's' : ''} de aprobación
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Revisa y aprueba las solicitudes de reserva
                  </p>
                </div>
              </div>
              <Link to="/reservations">
                <Button variant="outline" size="sm">
                  Revisar ahora
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

      {/* Reservas Prioritarias */}
      {!loadingPrioritarias && reservasPrioritarias.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Reservas Prioritarias</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservasPrioritarias.slice(0, 5).map((rec) => {
                const urgencia = rec.metadata?.urgencia as number || 0;
                const reservaId = rec.metadata?.reservaId as number;
                const isAltaUrgencia = urgencia >= 7;
                
                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isAltaUrgencia ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          Reserva #{reservaId || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{rec.razon}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${
                            isAltaUrgencia ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            Urgencia: {urgencia}/10
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {(rec.puntaje * 100).toFixed(0)}% prioridad
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (reservaId) {
                          // Buscar la reserva en las reservas pendientes
                          const reserva = reservasPendientes.find(r => r.id === reservaId);
                          if (reserva) {
                            handleViewDetails(reserva);
                          } else {
                            // Si no está en pendientes, navegar a la página de reservas
                            window.location.href = `/reservations?reservaId=${reservaId}`;
                          }
                        }
                      }}
                      className="ml-4"
                    >
                      Revisar
                    </Button>
                  </div>
                );
              })}
            </div>
            {reservasPrioritarias.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/reservations">
                  <Button variant="outline" size="sm">
                    Ver todas las prioritarias ({reservasPrioritarias.length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contenido principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Próximas reservas */}
        <UpcomingReservations
          reservas={data?.proximasReservas || []}
          loading={loading}
          onViewDetails={handleViewDetails}
        />

        {/* Estado del sistema */}
        {!loading && data && (
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Espacios disponibles</span>
                  <span className="text-sm font-medium text-green-600">
                    {data.stats.espaciosDisponibles}/{data.stats.totalEspacios}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas hoy</span>
                  <span className="text-sm font-medium text-purple-600">
                    {data.stats.reservasHoy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas aprobadas</span>
                  <span className="text-sm font-medium text-green-600">
                    {data.stats.reservasAprobadas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas pendientes</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {data.stats.reservasPendientes}
                  </span>
                </div>
                {data.stats.espaciosEnMantenimiento > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">En mantenimiento</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {data.stats.espaciosEnMantenimiento}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ocupación promedio</span>
                  <span className="text-sm font-medium text-purple-600">
                    {data.stats.ocupacionPromedio}%
                  </span>
                </div>
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
                <Link to="/reservations" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprobar reservas
                  </Button>
                </Link>
                <Link to="/reservations" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Crear nueva reserva
                  </Button>
                </Link>
                <Link to="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Ver calendario
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráficos */}
      {!loading && allReservas.length > 0 && (
        <DashboardCharts 
          reservas={allReservas}
          loading={loading}
        />
      )}

      {/* Acciones rápidas generales */}
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


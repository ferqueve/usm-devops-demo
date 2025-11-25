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
import { Calendar, AlertCircle, Plus } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visualización de reservas y solicitud de espacios
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
                  <span className="text-sm">Mis solicitudes pendientes</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {solicitudesPendientes.length}
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
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Reserva
                  </Button>
                </Link>
                <Link to="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Calendario
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


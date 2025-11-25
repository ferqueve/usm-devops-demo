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
import { AlertCircle, Package } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboardAdmin();
        setData(dashboardData);
        
        // Cargar todas las reservas para gráficos
        try {
          const todasReservas = await reservationsApi.obtenerTodasLasReservas();
          if (todasReservas.data) {
            setAllReservas(todasReservas.data);
          }
        } catch (error) {
          console.warn('No se pudieron cargar todas las reservas para gráficos:', error);
        }

        // Cargar solicitudes de inventario pendientes
        try {
          const solicitudes = await reservationsApi.listarSolicitudesInventario({
            estados: ['PENDIENTE'],
            page: 0,
            size: 1
          });
          if (solicitudes.data) {
            setSolicitudesPendientes(solicitudes.data.totalElements || 0);
          }
        } catch (error) {
          console.warn('No se pudieron cargar solicitudes de inventario:', error);
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
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrador</h2>
          <p className="text-muted-foreground">
            Vista completa del sistema de gestión de espacios
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {!loading && data && (
        <div className="grid gap-4 md:grid-cols-3">
          {solicitudesPendientes > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Solicitudes pendientes
                      </p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {solicitudesPendientes}
                      </p>
                    </div>
                  </div>
                  <Link to="/inventory/requests">
                    <Button variant="outline" size="sm">
                      Revisar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {data.stats.reservasPendientes > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Reservas pendientes
                      </p>
                      <p className="text-2xl font-bold text-orange-700">
                        {data.stats.reservasPendientes}
                      </p>
                    </div>
                  </div>
                  <Link to="/reservations">
                    <Button variant="outline" size="sm">
                      Revisar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {data.stats.espaciosEnMantenimiento > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Espacios en mantenimiento
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {data.stats.espaciosEnMantenimiento}
                      </p>
                    </div>
                  </div>
                  <Link to="/rooms">
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
                  <span className="text-sm">Usuarios activos</span>
                  <span className="text-sm font-medium text-blue-600">
                    {data.stats.usuariosActivos}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total usuarios</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {data.stats.totalUsuarios}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reservas hoy</span>
                  <span className="text-sm font-medium text-purple-600">
                    {data.stats.reservasHoy}
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
      </div>

      {/* Gráficos */}
      {!loading && allReservas.length > 0 && (
        <DashboardCharts 
          reservas={allReservas}
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


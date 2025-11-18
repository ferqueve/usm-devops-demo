import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import DashboardStats from './DashboardStats';
import UpcomingReservations from './UpcomingReservations';
import DashboardCharts from './DashboardCharts';
import QuickActions from './QuickActions';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import { useAuth } from '@/hooks/useAuth';
import type { Reserva } from '@/lib/types/spaces';
import { reservationsApi } from '@/lib/api/reservations';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMyReservationsOnly, setShowMyReservationsOnly] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [myReservas, setMyReservas] = useState<Reserva[]>([]);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await dashboardApi.obtenerDatosDashboard(user?.rol);
        setData(dashboardData);
        
        // Guardar todas las reservas para los gráficos (solo si no es DOCENTE)
        if (user?.rol !== 'DOCENTE') {
          try {
            const todasReservas = await reservationsApi.obtenerTodasLasReservas();
            if (todasReservas.data) {
              setAllReservas(todasReservas.data);
            }
          } catch (error) {
            console.warn('No se pudieron cargar todas las reservas para gráficos:', error);
          }
        } else {
          // Para DOCENTE, usar sus propias reservas para los gráficos
          try {
            const misReservas = await reservationsApi.obtenerMisReservas();
            if (misReservas.data) {
              setAllReservas(misReservas.data);
            }
          } catch (error) {
            console.warn('No se pudieron cargar mis reservas para gráficos:', error);
          }
        }

        // Cargar mis reservas para el filtro
        try {
          const myReservasRes = await reservationsApi.obtenerMisReservas();
          if (myReservasRes.data) {
            // Filtrar solo las futuras y aprobadas
            const ahora = new Date();
            const futuras = myReservasRes.data
              .filter(r => {
                const inicio = new Date(r.inicio);
                return inicio > ahora && r.estado === 'APROBADO';
              })
              .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
            setMyReservas(futuras);
          }
        } catch (error) {
          // Si falla, simplemente no mostrar el filtro de "mis reservas"
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
  }, [user?.rol]);

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  const handleToggleFilter = () => {
    setShowMyReservationsOnly(!showMyReservationsOnly);
  };

  const proximasReservas = showMyReservationsOnly && myReservas.length > 0
    ? myReservas
    : (data?.proximasReservas || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen general del sistema de gestión de espacios
          </p>
        </div>
      </div>

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
          reservas={proximasReservas}
          loading={loading}
          onViewDetails={handleViewDetails}
          showMyReservationsOnly={showMyReservationsOnly}
          onToggleFilter={myReservas.length > 0 ? handleToggleFilter : undefined}
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
                {user?.rol === 'ADMIN' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Usuarios activos</span>
                    <span className="text-sm font-medium text-blue-600">
                      {data.stats.usuariosActivos}
                    </span>
                  </div>
                )}
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

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { espaciosApi } from '@/lib/api/spaces';
import { inventarioApi } from '@/lib/api/inventory';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import { reservationsApi } from '@/lib/api/reservations';
import type { Reserva } from '@/lib/types/spaces';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Package, Sparkles, AlertTriangle } from 'lucide-react';

// Importar widgets
import DashboardStats from './DashboardStats';
import UpcomingReservations from './UpcomingReservations';
import DashboardCharts from './DashboardCharts';
import QuickActions from './QuickActions';
import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import InventoryStatsWidget from './widgets/InventoryStatsWidget';
import SpaceStatsWidget from './widgets/SpaceStatsWidget';
import PendingReservationsAlert from './widgets/PendingReservationsAlert';
import PriorityReservationsWidget from './widgets/PriorityReservationsWidget';
import PendingInventoryRequestsAlert from './widgets/PendingInventoryRequestsAlert';

interface InventoryStats {
  totalItems: number;
  disponibles: number;
  enMantenimiento: number;
  danados: number;
  sinAsignar: number;
}

interface EspaciosStats {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

export default function UnifiedDashboard() {
  const { hasPermission } = useRolePermissions();

  // Permission-based visibility
  const canViewReservationStats = hasPermission('estadisticas:ver'); // ANALISTA, ADMIN
  const canApproveReservations = hasPermission('reserva:aprobar'); // ANALISTA, ADMIN
  const canManageInventory = hasPermission('inventario:gestionar'); // ADMIN, MANTENIMIENTO
  const canViewInventory = hasPermission('inventario:ver'); // ANALISTA, ADMIN, MANTENIMIENTO
  const canViewRecommendations = hasPermission('recomendacion:ver'); // DOCENTE
  const canCreateReservations = hasPermission('reserva:crear'); // All except ALUMNO

  // Estados principales
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Estados para gráficos y widgets
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [reservasPrioritarias, setReservasPrioritarias] = useState<RecomendacionAnalista[]>([]);
  const [loadingPrioritarias, setLoadingPrioritarias] = useState(false);

  // Estados para Mantenimiento
  const [inventarioStats, setInventarioStats] = useState<InventoryStats | null>(null);
  const [espaciosStats, setEspaciosStats] = useState<EspaciosStats | null>(null);
  const [pendingInventoryRequests, setPendingInventoryRequests] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar datos del dashboard según permisos
        let dashboardData: DashboardData | null = null;

        if (canApproveReservations) {
          // ANALISTA o ADMIN
          dashboardData = await dashboardApi.obtenerDatosDashboardAnalista();
        } else if (canViewRecommendations && !canApproveReservations) {
          // DOCENTE
          dashboardData = await dashboardApi.obtenerDatosDashboardDocente();
        } else if (canManageInventory && !canApproveReservations) {
          // MANTENIMIENTO
          dashboardData = await dashboardApi.obtenerDatosDashboardMantenimiento();
        } else if (!canViewRecommendations && canCreateReservations) {
          // EXTERNO
          dashboardData = await dashboardApi.obtenerDatosDashboardExterno();
        } else {
          // ALUMNO (default)
          dashboardData = await dashboardApi.obtenerDatosDashboardAlumno();
        }

        setData(dashboardData);

        // Cargar reservas para gráficos (si puede ver estadísticas o crear reservas)
        if (canViewReservationStats || canCreateReservations || canViewRecommendations) {
          try {
            let reservasResponse;
            if (canApproveReservations) {
              // ANALISTA/ADMIN: todas las reservas
              reservasResponse = await reservationsApi.obtenerTodasLasReservas();
            } else {
              // DOCENTE/EXTERNO/ALUMNO: solo sus reservas
              reservasResponse = await reservationsApi.obtenerMisReservas();
            }

            if (reservasResponse.data) {
              setAllReservas(reservasResponse.data);
              // Filtrar reservas pendientes
              const pendientes = reservasResponse.data.filter(r => r.estado === 'PENDIENTE');
              setReservasPendientes(pendientes);
            }
          } catch (error) {
            console.warn('No se pudieron cargar todas las reservas para gráficos:', error);
          }
        }

        // Cargar reservas prioritarias (solo para ANALISTA)
        if (canApproveReservations) {
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
        }

        // Cargar estadísticas de inventario y espacios (solo para MANTENIMIENTO)
        if (canManageInventory && !canApproveReservations) {
          try {
            const [inventarioRes, espaciosRes] = await Promise.all([
              inventarioApi.obtenerEstadisticas(),
              espaciosApi.obtenerEstadisticas()
            ]);

            if (inventarioRes.data) {
              setInventarioStats(inventarioRes.data as InventoryStats);
            }
            if (espaciosRes.data) {
              setEspaciosStats(espaciosRes.data as EspaciosStats);
            }

            // Cargar solicitudes de inventario pendientes
            const pendingReqs = await inventarioApi.obtenerSolicitudesPendientes();
            if (pendingReqs.data) {
              setPendingInventoryRequests(pendingReqs.data.length);
            }
          } catch (error) {
            console.warn('No se pudieron cargar estadísticas de mantenimiento:', error);
          }
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
  }, [canApproveReservations, canViewRecommendations, canManageInventory, canCreateReservations, canViewReservationStats]);

  const handleViewDetails = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setDetailsDialog(true);
  };

  // Determinar título del dashboard
  const getDashboardTitle = () => {
    if (canApproveReservations) {
      return canManageInventory ? 'Dashboard Administrador' : 'Dashboard Analista';
    }
    if (canViewRecommendations && !canApproveReservations) {
      return 'Dashboard Docente';
    }
    if (canManageInventory && !canApproveReservations) {
      return 'Dashboard Mantenimiento';
    }
    if (!canViewRecommendations && canCreateReservations) {
      return 'Dashboard Externo';
    }
    return 'Dashboard';
  };

  const getDashboardDescription = () => {
    if (canApproveReservations) {
      return 'Gestión de reservas y seguimiento del sistema';
    }
    if (canViewRecommendations && !canApproveReservations) {
      return 'Gestiona tus clases y reservas de espacios';
    }
    if (canManageInventory && !canApproveReservations) {
      return 'Gestión de espacios e inventario';
    }
    if (!canViewRecommendations && canCreateReservations) {
      return 'Reserva espacios para tus eventos';
    }
    return 'Visualiza información del sistema';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{getDashboardTitle()}</h2>
          <p className="text-muted-foreground">{getDashboardDescription()}</p>
        </div>
      </div>

      {/* Alertas de reservas pendientes (ANALISTA/ADMIN/DOCENTE/EXTERNO) */}
      <PendingReservationsAlert
        reservasPendientes={reservasPendientes}
        loading={loading}
        canApprove={canApproveReservations}
      />

      {/* Alertas de solicitudes de inventario pendientes (ADMIN/MANTENIMIENTO) */}
      {canManageInventory && pendingInventoryRequests > 0 && (
        <PendingInventoryRequestsAlert count={pendingInventoryRequests} />
      )}

      {/* Estadísticas principales */}
      {/* Mostrar DashboardStats para roles con acceso a reservas */}
      {(canViewReservationStats || canCreateReservations || canViewRecommendations) && (
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
            promedioReservasPorEspacio: 0
          }}
          loading={loading}
        />
      )}

      {/* Estadísticas de inventario y espacios (solo MANTENIMIENTO sin acceso a reservas) */}
      {canManageInventory && !canApproveReservations && (
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2">
          <InventoryStatsWidget stats={inventarioStats} loading={loading} />
          <SpaceStatsWidget stats={espaciosStats} loading={loading} />
        </div>
      )}

      {/* Reservas Prioritarias (solo ANALISTA/ADMIN con permiso aprobar) */}
      <PriorityReservationsWidget
        reservasPrioritarias={reservasPrioritarias}
        reservasPendientes={reservasPendientes}
        loading={loadingPrioritarias}
        canApprove={canApproveReservations}
        onViewDetails={handleViewDetails}
      />

      {/* Layout de 2 columnas */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Próximas reservas (ADMIN/ANALISTA/ALUMNO con acceso a reservas) */}
        {(canApproveReservations || (!canViewRecommendations && !canManageInventory)) && data?.proximasReservas && (
          <UpcomingReservations
            reservas={data.proximasReservas}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Gráficos (todos excepto MANTENIMIENTO puro) */}
        {(canViewReservationStats || canCreateReservations || canViewRecommendations) && (
          <DashboardCharts reservas={allReservas} />
        )}
      </div>

      {/* Acciones rápidas (todos los roles) */}
      {canCreateReservations && <QuickActions />}

      {/* Diálogo de detalles de reserva */}
      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
          onReservaUpdated={() => {
            // Recargar datos después de actualizar una reserva
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

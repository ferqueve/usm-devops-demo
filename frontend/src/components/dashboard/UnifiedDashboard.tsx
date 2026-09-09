import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dashboardApi, resumenEspacios, type DashboardData } from '@/lib/api/dashboard';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import type { Reserva } from '@/lib/types/spaces';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';

import ReservationDetailsDialog from '@/components/reservations/ReservationDetailsDialog';
import { AdminDashboard } from './views/AdminDashboard';
import { AnalistaDashboard } from './views/AnalistaDashboard';
import { DocenteDashboard } from './views/DocenteDashboard';
import { MantenimientoDashboard } from './views/MantenimientoDashboard';
import { EstudianteDashboard } from './views/EstudianteDashboard';
import { ExternoDashboard } from './views/ExternoDashboard';

/**
 * Prioridades de la cola: es una recomendacion que el backend calcula recorriendo
 * las pendientes, asi que va aparte y con su propio indicador de carga. La
 * pantalla se dibuja completa sin esperarla.
 */
async function cargarPrioritarias(): Promise<RecomendacionAnalista[]> {
  try {
    const res = await recomendacionesApi.obtenerReservasPrioritarias();
    return res.success && res.data ? res.data : [];
  } catch (error) {
    console.warn('No se pudieron cargar reservas prioritarias:', error);
    return [];
  }
}

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const rol = user?.rol;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [reservasPrioritarias, setReservasPrioritarias] = useState<RecomendacionAnalista[]>([]);
  const [loadingPrioritarias, setLoadingPrioritarias] = useState(false);

  const apruebaReservas = rol === ROLES.ADMIN || rol === ROLES.ANALISTA;

  useEffect(() => {
    let vigente = true;

    dashboardApi
      .obtenerDatosDashboard()
      .then((datos) => {
        if (vigente) setData(datos);
      })
      .catch((error: unknown) => {
        console.error('Error al cargar datos del dashboard:', error);
        const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
        toast.error('Error al cargar el dashboard', { description: msg });
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    if (apruebaReservas) {
      setLoadingPrioritarias(true);
      cargarPrioritarias()
        .then((p) => {
          if (vigente) setReservasPrioritarias(p);
        })
        .finally(() => {
          if (vigente) setLoadingPrioritarias(false);
        });
    }

    return () => {
      vigente = false;
    };
  }, [apruebaReservas]);

  const espaciosStats = useMemo(() => resumenEspacios(data?.stats), [data?.stats]);

  const handleViewDetails = (r: Reserva) => {
    setSelectedReserva(r);
    setDetailsDialog(true);
  };

  const renderView = () => {
    const misReservas = data?.misReservas ?? [];
    const pendientes = data?.reservasPendientes ?? [];
    const solicitudesInventario = data?.solicitudesInventarioPendientes ?? 0;

    if (rol === ROLES.ADMIN) {
      return (
        <AdminDashboard
          data={data}
          loading={loading}
          reservasPrioritarias={reservasPrioritarias}
          reservasPendientes={pendientes}
          loadingPrioritarias={loadingPrioritarias}
          pendingInventoryRequests={solicitudesInventario}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.ANALISTA) {
      return (
        <AnalistaDashboard
          data={data}
          loading={loading}
          reservasPrioritarias={reservasPrioritarias}
          reservasPendientes={pendientes}
          loadingPrioritarias={loadingPrioritarias}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.MANTENIMIENTO) {
      return (
        <MantenimientoDashboard
          data={data}
          loading={loading}
          inventarioStats={data?.inventarioStats ?? null}
          espaciosStats={espaciosStats}
          pendingInventoryRequests={solicitudesInventario}
        />
      );
    }
    if (rol === ROLES.DOCENTE) {
      return (
        <DocenteDashboard
          data={data}
          loading={loading}
          misReservas={misReservas}
          onViewDetails={handleViewDetails}
        />
      );
    }
    if (rol === ROLES.EXTERNO) {
      return (
        <ExternoDashboard
          data={data}
          loading={loading}
          misReservas={misReservas}
          onViewDetails={handleViewDetails}
        />
      );
    }
    return (
      <EstudianteDashboard data={data} loading={loading} onViewDetails={handleViewDetails} />
    );
  };

  // h-full: el dashboard ocupa el alto que le da el layout y son los paneles
  // los que scrollean por dentro, no la pagina.
  return (
    <div className="flex h-full min-h-0 flex-col">
      {renderView()}

      {selectedReserva && (
        <ReservationDetailsDialog
          reserva={selectedReserva}
          open={detailsDialog}
          onOpenChange={setDetailsDialog}
          onReservaUpdated={() => {
            globalThis.location.reload();
          }}
        />
      )}
    </div>
  );
}

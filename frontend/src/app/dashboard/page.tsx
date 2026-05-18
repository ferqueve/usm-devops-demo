import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Dashboard from '@/components/dashboard/index';
import { dashboardApi } from '@/lib/api/dashboard';
import { reservationsApi } from '@/lib/api/reservations';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import { authApi } from '@/lib/api/auth';
import { ROLES } from '@/lib/config/constants';

// Precarga: cuando Vite/lazy carga este chunk, ya disparamos los fetches
// del dashboard usando el rol guardado en localStorage. Los disparamos antes
// de que el componente monte. Cuando finalmente el useEffect llame al mismo
// endpoint, el dedupe del API client lo colapsa con esta llamada en vuelo.
(() => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    const user = JSON.parse(userJson) as { rol?: string };
    const rol = user?.rol;
    if (!rol) return;

    // /auth/verify lo dispara AuthProvider tarde — adelantémoslo.
    authApi.verifyToken().catch(() => {});

    if (rol === ROLES.ADMIN) dashboardApi.obtenerDatosDashboardAdmin();
    else if (rol === ROLES.ANALISTA) dashboardApi.obtenerDatosDashboardAnalista();
    else if (rol === ROLES.MANTENIMIENTO) dashboardApi.obtenerDatosDashboardMantenimiento();
    else if (rol === ROLES.DOCENTE) dashboardApi.obtenerDatosDashboardDocente();
    else if (rol === ROLES.EXTERNO) dashboardApi.obtenerDatosDashboardExterno();
    else if (rol === ROLES.ESTUDIANTE) dashboardApi.obtenerDatosDashboardEstudiante();

    // UnifiedDashboard también pide pendientes y prioritarias como pasos
    // separados; los pre-disparamos en paralelo. El dedupe del API client
    // colapsa la segunda llamada cuando el componente monta.
    const canApprove = rol === ROLES.ADMIN || rol === ROLES.ANALISTA;
    if (canApprove) {
      reservationsApi.obtenerTodasReservasPaged({
        estado: 'PENDIENTE',
        page: 0,
        size: 30,
      }).catch(() => {});
      recomendacionesApi.obtenerReservasPrioritarias().catch(() => {});
    }
  } catch { /* no-op */ }
})();

// Página principal del dashboard
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}


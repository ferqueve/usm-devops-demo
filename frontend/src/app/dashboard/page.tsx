import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Dashboard from '@/components/dashboard/index';
import { dashboardApi } from '@/lib/api/dashboard';
import { recomendacionesApi } from '@/lib/api/recomendaciones';
import { ROLES } from '@/lib/config/constants';

// Precarga: apenas Vite carga este chunk disparamos las dos llamadas de la
// pantalla, antes de que monte el componente. Cuando el useEffect pida lo mismo,
// el dedupe del API client lo colapsa con la peticion en vuelo.
(() => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    const rol = (JSON.parse(userJson) as { rol?: string })?.rol;
    if (!rol) return;

    // El error se traga a propósito: esto sólo adelanta la petición. La que
    // cuenta la hace el componente, y ésa sí muestra el error en pantalla.
    dashboardApi.obtenerDatosDashboard().catch(() => {});

    if (rol === ROLES.ADMIN || rol === ROLES.ANALISTA) {
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

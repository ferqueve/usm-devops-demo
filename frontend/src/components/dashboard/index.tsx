import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';
import AdminDashboard from './AdminDashboard';
import AnalistaDashboard from './AnalistaDashboard';
import MantenimientoDashboard from './MantenimientoDashboard';
import DocenteDashboard from './DocenteDashboard';
import EstudianteDashboard from './EstudianteDashboard';
import ExternoDashboard from './ExternoDashboard';

// Router principal que redirige según el rol del usuario
export default function Dashboard() {
  const { user } = useAuth();

  // Renderizar el dashboard correspondiente según el rol
  switch (user?.rol) {
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.ANALISTA:
      return <AnalistaDashboard />;
    case ROLES.MANTENIMIENTO:
      return <MantenimientoDashboard />;
    case ROLES.DOCENTE:
      return <DocenteDashboard />;
    case ROLES.ESTUDIANTE:
      return <EstudianteDashboard />;
    case ROLES.EXTERNO:
      return <ExternoDashboard />;
    default:
      // Por defecto, mostrar dashboard de estudiante
      return <EstudianteDashboard />;
  }
}

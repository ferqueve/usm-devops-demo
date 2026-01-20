import UnifiedDashboard from './UnifiedDashboard';

// Dashboard unificado basado en permisos
// Ya no necesitamos router por rol - el UnifiedDashboard se adapta automáticamente
export default function Dashboard() {
  return <UnifiedDashboard />;
}

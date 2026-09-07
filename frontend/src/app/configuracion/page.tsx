import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import ConfiguracionManagement from '@/components/configuracion';

// Página de configuración: catálogos del sistema (tipos de espacio, etc.)
export default function ConfiguracionPage() {
  return (
    <DashboardLayout hideTitle>
      <ConfiguracionManagement />
    </DashboardLayout>
  );
}

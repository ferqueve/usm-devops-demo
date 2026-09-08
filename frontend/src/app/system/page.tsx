import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import System from '@/components/system/index';

// Página de Sistema - Solo para Administradores
export default function SystemPage() {
  return (
    <DashboardLayout hideTitle>
      <System />
    </DashboardLayout>
  );
}


import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Dashboard from '@/components/dashboard/index';

// Página principal del dashboard
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}


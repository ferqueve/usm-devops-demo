import { DashboardLayout } from '@/components/layouts';
import Dashboard from '@/components/dashboard';

// Página principal del dashboard
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

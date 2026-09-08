import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import SpacesManagement from '@/components/spaces';

// Página de gestión de espacios
export default function RoomsPage() {
  return (
    <DashboardLayout hideTitle>
      <SpacesManagement />
    </DashboardLayout>
  );
}


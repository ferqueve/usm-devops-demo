import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Rooms from '@/components/rooms/index';

// Página de salones
export default function RoomsPage() {
  return (
    <DashboardLayout>
      <Rooms />
    </DashboardLayout>
  );
}


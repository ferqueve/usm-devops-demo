import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Reservations from '@/components/reservations/index';

// Página de reservas
export default function ReservationsPage() {
  return (
    <DashboardLayout hideTitle>
      <Reservations />
    </DashboardLayout>
  );
}


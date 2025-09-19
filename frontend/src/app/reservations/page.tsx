import { DashboardLayout } from '@/components/layouts';
import Reservations from '@/components/reservations';

// Página de reservas
export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <Reservations />
    </DashboardLayout>
  );
}

import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Reservations from '@/components/reservations';

// Página de reservas
export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <Reservations />
    </DashboardLayout>
  );
}

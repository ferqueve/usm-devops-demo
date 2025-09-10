import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Rooms from '@/components/rooms';

// Página de salones
export default function RoomsPage() {
  return (
    <DashboardLayout>
      <Rooms />
    </DashboardLayout>
  );
}

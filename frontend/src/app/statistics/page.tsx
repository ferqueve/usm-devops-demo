import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Statistics from '@/components/statistics';

// Página de estadísticas
export default function StatisticsPage() {
  return (
    <DashboardLayout>
      <Statistics />
    </DashboardLayout>
  );
}

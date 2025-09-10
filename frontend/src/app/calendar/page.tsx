import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Calendar from '@/components/calendar';

// Página del calendario
export default function CalendarPage() {
  return (
    <DashboardLayout>
      <Calendar />
    </DashboardLayout>
  );
}

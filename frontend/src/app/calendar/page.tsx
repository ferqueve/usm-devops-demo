import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Calendar from '@/components/calendar/index';

// Página del calendario
export default function CalendarPage() {
  return (
    <DashboardLayout>
      <Calendar />
    </DashboardLayout>
  );
}


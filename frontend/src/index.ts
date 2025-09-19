// Exportaciones de layouts
export { DashboardLayout } from '@/components/layouts';

// Exportaciones de páginas principales
export { default as LoginPage } from '@/app/public/login/page';
export { default as DashboardPage } from '@/app/dashboard/page';
export { default as CalendarPage } from '@/app/calendar/page';
export { default as ReservationsPage } from '@/app/reservations/page';
export { default as RoomsPage } from '@/app/rooms/page';
export { default as StatisticsPage } from '@/app/statistics/page';
export { default as SettingsPage } from '@/app/settings/page';

// Exportaciones de componentes del dashboard
export { DashboardSidebar, DashboardHeader } from '@/components/layouts/DashboardLayout';

// Exportaciones de componentes principales
export { default as Dashboard } from '@/components/dashboard';
export { default as Calendar } from '@/components/calendar';
export { default as Reservations } from '@/components/reservations';
export { default as Rooms } from '@/components/rooms';
export { default as Statistics } from '@/components/statistics';
export { default as Settings } from '@/components/settings';

// Exportaciones de tipos
export type { 
  DashboardPageProps, 
  SidebarMenuItem, 
  Reservation,
  Room,
  Statistic,
  CalendarEvent
} from '@/lib/types/dashboard';

// Exportaciones de configuración
export { sidebarMenuItems } from '@/lib/config/navigation';

// Exportaciones de contexto
export { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Exportaciones de utilidades
export { 
  APP_CONFIG, 
  routeUtils, 
  storageUtils, 
  validationUtils, 
  errorUtils 
} from '@/lib/utils/constants';

// Exportaciones de datos mock
export {
  dashboardStats,
  mockReservations,
  mockRooms,
  mockCalendarEvents,
  mockStatistics
} from '@/data/mock-data';

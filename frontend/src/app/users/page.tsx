import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Users from '@/components/users/index';

// Página de gestión de usuarios
export default function UsersPage() {
  return (
    <DashboardLayout hideTitle>
      <Users />
    </DashboardLayout>
  );
}


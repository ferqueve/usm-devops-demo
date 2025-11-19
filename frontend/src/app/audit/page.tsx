import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import AuditManagement from '@/components/audit/AuditManagement';

export default function AuditPage() {
  return (
    <DashboardLayout>
      <AuditManagement />
    </DashboardLayout>
  );
}


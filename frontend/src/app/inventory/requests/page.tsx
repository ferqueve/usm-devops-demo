import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import InventoryRequestsManagement from '@/components/inventory/InventoryRequestsManagement';

export default function InventoryRequestsPage() {
  return (
    <DashboardLayout hideTitle>
      <InventoryRequestsManagement />
    </DashboardLayout>
  );
}


import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";
import InventoryManagement from "@/components/inventory";

export default function InventoryPage() {
  return (
    <DashboardLayout hideTitle>
      <InventoryManagement />
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";
import EventosManagement from "@/components/eventos/EventosManagement";

export default function EventosPage() {
  return (
    <DashboardLayout hideTitle>
      <EventosManagement />
    </DashboardLayout>
  );
}

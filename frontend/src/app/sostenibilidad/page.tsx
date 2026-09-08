import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";
import SostenibilidadDashboard from "@/components/sostenibilidad/SostenibilidadDashboard";

export default function SostenibilidadPage() {
  return (
    <DashboardLayout hideTitle>
      <SostenibilidadDashboard />
    </DashboardLayout>
  );
}

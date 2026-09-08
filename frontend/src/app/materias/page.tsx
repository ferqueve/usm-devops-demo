import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";
import MateriasManagement from "@/components/materias/MateriasManagement";

export default function MateriasPage() {
  return (
    <DashboardLayout hideTitle>
      <MateriasManagement />
    </DashboardLayout>
  );
}

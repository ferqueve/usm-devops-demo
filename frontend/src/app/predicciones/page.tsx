import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Predicciones from '@/components/predicciones';

export default function PrediccionesPage() {
  return (
    <DashboardLayout hideTitle>
      <Predicciones />
    </DashboardLayout>
  );
}

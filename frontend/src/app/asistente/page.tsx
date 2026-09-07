import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import Asistente from '@/components/asistente';

export default function AsistentePage() {
  return (
    <DashboardLayout hideTitle>
      <Asistente />
    </DashboardLayout>
  );
}

import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { MapaCorrelativas } from '@/components/materias/MapaCorrelativas';

export default function MateriasMapaPage() {
  return (
    <DashboardLayout title="Mapa de la carrera">
      <MapaCorrelativas />
    </DashboardLayout>
  );
}

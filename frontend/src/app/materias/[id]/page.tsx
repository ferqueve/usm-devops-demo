import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { MateriaDetail } from '@/components/materias/MateriaDetail';

export default function MateriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const materiaId = id ? Number.parseInt(id, 10) : Number.NaN;

  if (!id || Number.isNaN(materiaId)) {
    return (
      <DashboardLayout title="Materias">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">ID de materia no válido</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Materias">
      <MateriaDetail materiaId={materiaId} />
    </DashboardLayout>
  );
}

import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { TutoriaDetail } from '@/components/tutorias/TutoriaDetail';

export default function TutoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tutoriaId = id ? Number.parseInt(id, 10) : Number.NaN;

  if (!id || Number.isNaN(tutoriaId)) {
    return (
      <DashboardLayout title="Tutorías">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">ID de tutoría no válido</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tutorías">
      <TutoriaDetail tutoriaId={tutoriaId} />
    </DashboardLayout>
  );
}

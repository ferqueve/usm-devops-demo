import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { EventoDetail } from '@/components/eventos/EventoDetail';

export default function EventoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventoId = id ? Number.parseInt(id, 10) : Number.NaN;

  if (!id || Number.isNaN(eventoId)) {
    return (
      <DashboardLayout title="Eventos">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">ID de evento no válido</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Eventos">
      <EventoDetail eventoId={eventoId} />
    </DashboardLayout>
  );
}

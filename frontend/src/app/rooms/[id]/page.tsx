import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { SpaceDetails } from '@/components/spaces/SpaceDetails';
import { useParams } from 'react-router-dom';

export default function RoomDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">ID de espacio no válido</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SpaceDetails espacioId={parseInt(id)} />
    </DashboardLayout>
  );
}

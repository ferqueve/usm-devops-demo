import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import { SpaceDetails } from '@/components/spaces/SpaceDetails';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { espaciosApi } from '@/lib/api/spaces';

export default function RoomDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [espacioName, setEspacioName] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      // Obtener el nombre del espacio para el título
      const fetchEspacioName = async () => {
        try {
          const response = await espaciosApi.obtenerEspacio(Number.parseInt(id));
          if (response.data) {
            setEspacioName(response.data.nombre);
          }
        } catch (error) {
          console.error('Error al obtener nombre del espacio:', error);
        }
      };
      
      fetchEspacioName();
    }
  }, [id]);
  
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
    <DashboardLayout title={espacioName ? `Espacios - ${espacioName}` : 'Espacios'}>
      <SpaceDetails espacioId={Number.parseInt(id)} />
    </DashboardLayout>
  );
}

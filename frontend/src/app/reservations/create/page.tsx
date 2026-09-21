import { DashboardLayout } from '@/components/layouts/DashboardLayout/DashboardLayout';
import ReservationForm from '@/components/reservations/ReservationForm';
import { useNavigate } from 'react-router-dom';

// Página de creación de reserva
export default function CreateReservationPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/reservations');
  };

  const handleCancel = () => {
    navigate('/reservations');
  };

  return (
    // El formulario trae su propio encabezado ("Nueva Solicitud de Reserva");
    // sin hideTitle el layout sumaba otro armado desde la URL: "Reservations/create".
    <DashboardLayout hideTitle>
      <ReservationForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </DashboardLayout>
  );
}


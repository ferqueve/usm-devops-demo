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
    <DashboardLayout>
      <ReservationForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </DashboardLayout>
  );
}


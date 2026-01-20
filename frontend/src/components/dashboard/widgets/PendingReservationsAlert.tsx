import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Reserva } from '@/lib/types/spaces';

interface PendingReservationsAlertProps {
  reservasPendientes: Reserva[];
  loading: boolean;
  canApprove: boolean;
}

export default function PendingReservationsAlert({
  reservasPendientes,
  loading,
  canApprove
}: PendingReservationsAlertProps) {
  if (loading || reservasPendientes.length === 0) {
    return null;
  }

  const count = reservasPendientes.length;
  const message = canApprove
    ? `Tienes ${count} reserva${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} de aprobación`
    : `Tienes ${count} solicitud${count > 1 ? 'es' : ''} pendiente${count > 1 ? 's' : ''} de aprobación`;

  const description = canApprove
    ? 'Revisa y aprueba las solicitudes de reserva'
    : 'Tus solicitudes están siendo revisadas por un analista';

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">{message}</p>
              <p className="text-xs text-orange-700 mt-1">{description}</p>
            </div>
          </div>
          {canApprove && (
            <Link to="/reservations">
              <Button variant="outline" size="sm">
                Revisar ahora
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

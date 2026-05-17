import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PendingReservationsAlertProps {
  /** Total de reservas pendientes (viene del stats endpoint, no de descargar la lista). */
  count: number;
  loading: boolean;
  canApprove: boolean;
}

export default function PendingReservationsAlert({
  count,
  loading,
  canApprove,
}: Readonly<PendingReservationsAlertProps>) {
  if (loading || count === 0) {
    return null;
  }
  const sufijoS = count > 1 ? 's' : '';
  const sufijoEs = count > 1 ? 'es' : '';
  const message = canApprove
    ? `Tienes ${count} reserva${sufijoS} pendiente${sufijoS} de aprobación`
    : `Tienes ${count} solicitud${sufijoEs} pendiente${sufijoS} de aprobación`;

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

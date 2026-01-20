import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PendingInventoryRequestsAlertProps {
  count: number;
}

export default function PendingInventoryRequestsAlert({ count }: PendingInventoryRequestsAlertProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Tienes {count} solicitud{count > 1 ? 'es' : ''} de inventario pendiente{count > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Revisa y procesa las solicitudes de inventario
              </p>
            </div>
          </div>
          <Link to="/inventory/requests">
            <Button variant="outline" size="sm">
              Revisar ahora
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

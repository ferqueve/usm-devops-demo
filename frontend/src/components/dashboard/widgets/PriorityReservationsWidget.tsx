import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import type { RecomendacionAnalista } from '@/lib/types/recomendaciones';

interface PriorityReservationsWidgetProps {
  reservasPrioritarias: RecomendacionAnalista[];
  reservasPendientes: Reserva[];
  loading: boolean;
  canApprove: boolean;
  onViewDetails: (reserva: Reserva) => void;
}

// Intenta extraer un id de reserva desde la razón (ej. "Reserva #123")
function extractReservaIdFromRazon(razon: unknown): number | undefined {
  if (!razon) return undefined;
  const m = /#(\d+)/.exec(String(razon));
  return m ? Number(m[1]) : undefined;
}

// Empareja una recomendación con una reserva pendiente por inicio/fin/espacio
function findReservaPendienteMatch(rec: RecomendacionAnalista, reservasPendientes: Reserva[]): number | undefined {
  if (!rec.inicio || !rec.fin) return undefined;
  const match = reservasPendientes.find(r =>
    r.inicio === rec.inicio &&
    r.fin === rec.fin &&
    (rec.espacioNombre ? r.espacioNombre === rec.espacioNombre : true)
  );
  return match?.id;
}

// Resuelve el id de la reserva probando varias fuentes en orden de confiabilidad
function resolveReservaId(rec: RecomendacionAnalista, reservasPendientes: Reserva[]): number | undefined {
  if (typeof rec.reservaId === 'number') return rec.reservaId;
  const metaId = rec.metadata?.reservaId;
  if (typeof metaId === 'number' || typeof metaId === 'string') return Number(metaId);
  return findReservaPendienteMatch(rec, reservasPendientes) ?? extractReservaIdFromRazon(rec.razon);
}

interface PriorityRowProps {
  rec: RecomendacionAnalista;
  reservasPendientes: Reserva[];
  onViewDetails: (reserva: Reserva) => void;
}

function PriorityReservationRow({ rec, reservasPendientes, onViewDetails }: Readonly<PriorityRowProps>) {
  const urgencia = (rec.metadata?.urgencia as number) ?? rec.urgencia ?? 0;
  const isAltaUrgencia = urgencia >= 7;
  const inferredReservaId = resolveReservaId(rec, reservasPendientes);
  const displayLabel = inferredReservaId ? `Reserva #${inferredReservaId}` : 'Buscar reserva relacionada';

  const handleReviewClick = () => {
    if (inferredReservaId) {
      const reserva = reservasPendientes.find(r => r.id === Number(inferredReservaId));
      if (reserva) {
        onViewDetails(reserva);
        return;
      }
      globalThis.location.href = `/reservations?reservaId=${inferredReservaId}`;
      return;
    }
    const q = encodeURIComponent(rec.razon || rec.espacioNombre || '');
    globalThis.location.href = `/reservations?search=${q}`;
  };

  const iconWrapperClass = `flex items-center justify-center w-10 h-10 rounded-full ${
    isAltaUrgencia ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-700'
  }`;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-md transition-all">
      <div className="flex items-center gap-3 flex-1">
        <div className={iconWrapperClass}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {rec.razon || 'Reserva prioritaria'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {rec.espacioNombre || 'Espacio sin especificar'} - Urgencia: {urgencia}/10
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={handleReviewClick} className="shrink-0">
        {displayLabel}
      </Button>
    </div>
  );
}

export default function PriorityReservationsWidget({
  reservasPrioritarias,
  reservasPendientes,
  loading,
  canApprove,
  onViewDetails
}: Readonly<PriorityReservationsWidgetProps>) {
  if (!canApprove || loading || reservasPrioritarias.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900">Reservas Prioritarias</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reservasPrioritarias.slice(0, 5).map((rec) => (
            <PriorityReservationRow
              key={rec.id}
              rec={rec}
              reservasPendientes={reservasPendientes}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

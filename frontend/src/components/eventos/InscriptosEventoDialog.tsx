import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { eventosApi } from '@/lib/api/eventos';
import type { Evento, EventoInscripto } from '@/lib/types/eventos';

interface InscriptosEventoDialogProps {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InscriptosEventoDialog({
  evento,
  open,
  onOpenChange,
}: Readonly<InscriptosEventoDialogProps>) {
  const [inscriptos, setInscriptos] = useState<EventoInscripto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !evento) return;
    let cancelled = false;
    setLoading(true);
    eventosApi
      .inscriptos(evento.id)
      .then((res) => {
        if (!cancelled) setInscriptos(res.data ?? []);
      })
      .catch((error: unknown) => {
        const description = error instanceof Error ? error.message : 'No se pudieron cargar los inscriptos';
        toast.error('Error al cargar inscriptos', { description });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, evento]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-cyan/10 text-utec-cyan">
              <Users className="h-4 w-4" />
            </span>
            Inscriptos
          </DialogTitle>
          <DialogDescription>
            {evento ? `Personas inscriptas en "${evento.titulo}".` : 'Listado de inscriptos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              );
            }
            if (inscriptos.length === 0) {
              return (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay inscriptos todavía</p>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {inscriptos.map((i) => (
                  <div
                    key={i.inscripcionId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{i.nombre ?? 'Sin nombre'}</p>
                      {i.email && <p className="text-xs text-muted-foreground truncate">{i.email}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {i.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

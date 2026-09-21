import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { CalendarClock, GraduationCap, Loader2, PartyPopper } from 'lucide-react';
import { feriadoDe } from '@/lib/feriadosUy';
import type { Tutoria } from '@/lib/types/tutorias';
import { fechaHoraLarga } from '@/lib/utils/fechas';


interface Props {
  tutoria: Tutoria | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (temario: string) => void;
}

export function AgendarTutoriaDialog({ tutoria, open, loading, onOpenChange, onConfirm }: Readonly<Props>) {
  const [temario, setTemario] = useState('');
  useEffect(() => { if (open) setTemario(''); }, [open]);

  const feriado = tutoria ? feriadoDe(tutoria.inicio) : null;
  const sinPlazas = tutoria != null && tutoria.plazasDisponibles <= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => (loading ? undefined : onOpenChange(v))}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-blue/10 text-marca-azul-texto"><GraduationCap className="h-4 w-4" /></span>
            Agendar tutoría
          </DialogTitle>
          <DialogDescription>{tutoria?.materiaNombre} · {tutoria?.docenteNombre}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" />{fechaHoraLarga(tutoria?.inicio, '')}</p>

          {feriado && (
            <div className="flex items-center gap-2 rounded-lg border border-utec-yellow/40 bg-utec-yellow/10 px-3 py-2 text-sm">
              <PartyPopper className="h-4 w-4 text-marca-naranja-texto shrink-0" />
              <span>Ojo: ese día es feriado en Uruguay (<b>{feriado}</b>). Confirmá que la tutoría se dicta igual.</span>
            </div>
          )}

          {sinPlazas && (
            <div className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              No hay plazas libres: vas a quedar en <b>lista de espera</b> y te avisamos si se libera un lugar.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="temario">¿Qué querés repasar? (opcional)</Label>
            <textarea
              id="temario" rows={3} value={temario} onChange={(e) => setTemario(e.target.value)} disabled={loading}
              placeholder="Ej: integrales por partes, límites indeterminados…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <p className="text-2xs text-muted-foreground">El docente ve estos temas para preparar mejor la tutoría.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={() => onConfirm(temario.trim())} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {sinPlazas ? 'Anotarme en espera' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

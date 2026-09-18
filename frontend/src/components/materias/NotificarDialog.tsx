import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { materiasApi } from '@/lib/api/materias';

interface NotificarDialogProps {
  materiaId: number;
  materiaNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificarDialog({ materiaId, materiaNombre, open, onOpenChange }: Readonly<NotificarDialogProps>) {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) { setAsunto(`Aviso · ${materiaNombre}`); setMensaje(''); }
  }, [open, materiaNombre]);

  const enviar = async () => {
    if (!mensaje.trim()) { toast.error('Escribí un mensaje'); return; }
    try {
      setSending(true);
      const r = await materiasApi.notificarInscriptos(materiaId, { asunto, mensaje });
      const { enviados = 0, total = 0 } = r.data ?? {};
      if (enviados > 0) {
        toast.success(`Notificación enviada a ${enviados}/${total} inscriptos`);
      } else {
        toast.warning('No se envió ningún email', { description: 'El servicio de email puede no estar disponible (Gmail).' });
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error('No se pudo notificar', { description: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (sending ? undefined : onOpenChange(v))}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-green/10 text-marca-verde-texto"><Mail className="h-4 w-4" /></span>
            Notificar a inscriptos
          </DialogTitle>
          <DialogDescription>Se enviará un email a todos los estudiantes inscriptos en la materia.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="notif-asunto">Asunto</Label>
            <Input id="notif-asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} disabled={sending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-mensaje">Mensaje</Label>
            <textarea
              id="notif-mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={sending}
              rows={5}
              placeholder="Escribí el aviso para los inscriptos…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={enviar} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

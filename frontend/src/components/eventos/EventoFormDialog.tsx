import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { eventosApi } from '@/lib/api/eventos';
import { useEspacios } from '@/hooks/useEspacios';
import type { Evento, EventoTipo } from '@/lib/types/eventos';

interface EventoFormDialogProps {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (evento: Evento) => void;
}

const NO_ESPACIO = 'none';

// ISO instant -> valor para <input type="datetime-local"> (hora local)
function isoToLocalInput(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

// valor de <input type="datetime-local"> -> ISO instant (UTC)
function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export function EventoFormDialog({
  evento,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<EventoFormDialogProps>) {
  const isEditing = !!evento;
  const { espacios } = useEspacios();
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('EVENTO');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [cupo, setCupo] = useState('');
  const [esPublico, setEsPublico] = useState('true');
  const [espacioId, setEspacioId] = useState<string>(NO_ESPACIO);

  useEffect(() => {
    if (open) {
      setTitulo(evento?.titulo ?? '');
      setDescripcion(evento?.descripcion ?? '');
      setTipo(evento?.tipo ?? 'EVENTO');
      setInicio(isoToLocalInput(evento?.inicio));
      setFin(isoToLocalInput(evento?.fin));
      setCupo(evento?.cupo != null ? String(evento.cupo) : '');
      setEsPublico(evento?.esPublico === false ? 'false' : 'true');
      setEspacioId(evento?.espacioId != null ? String(evento.espacioId) : NO_ESPACIO);
    }
  }, [open, evento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    if (!inicio) {
      toast.error('La fecha de inicio es requerida');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      inicio: localInputToIso(inicio),
      fin: fin ? localInputToIso(fin) : undefined,
      cupo: cupo.trim() ? Number(cupo) : undefined,
      esPublico: esPublico === 'true',
      espacioId: espacioId !== NO_ESPACIO ? Number(espacioId) : undefined,
    };

    try {
      setLoading(true);
      const response = isEditing && evento
        ? await eventosApi.actualizar(evento.id, payload)
        : await eventosApi.crear(payload);
      if (response.data) {
        toast.success(isEditing ? 'Evento actualizado' : 'Evento creado');
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo guardar el evento';
      toast.error(isEditing ? 'Error al actualizar evento' : 'Error al crear evento', { description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del evento seleccionado.'
              : 'Completa los datos para publicar un nuevo evento u oferta abierta.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="evento-titulo">Título</Label>
            <Input
              id="evento-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Charla de IA aplicada"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evento-descripcion">Descripción</Label>
            <Textarea
              id="evento-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles del evento"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as EventoTipo)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENTO">Evento</SelectItem>
                  <SelectItem value="CURSO">Curso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <Select value={esPublico} onValueChange={setEsPublico} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Público (oferta abierta)</SelectItem>
                  <SelectItem value="false">Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evento-inicio">Inicio</Label>
              <Input
                id="evento-inicio"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evento-fin">Fin (opcional)</Label>
              <Input
                id="evento-fin"
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evento-cupo">Cupo (opcional)</Label>
              <Input
                id="evento-cupo"
                type="number"
                min={1}
                value={cupo}
                onChange={(e) => setCupo(e.target.value)}
                placeholder="Sin límite"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Espacio (opcional)</Label>
              <Select value={espacioId} onValueChange={setEspacioId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ESPACIO}>Sin espacio</SelectItem>
                  {espacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={String(espacio.id)}>
                      {espacio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={[isEditing ? 'evento:editar' : 'evento:crear']}>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

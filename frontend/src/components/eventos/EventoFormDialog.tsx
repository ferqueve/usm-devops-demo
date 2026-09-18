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
import { CalendarPlus, Loader2, Save, Sparkles, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { eventosApi } from '@/lib/api/eventos';
import { postGenerarEvento } from '@/lib/api/ai';
import { useEspacios } from '@/hooks/useEspacios';
import type { Evento, EventoRecurrencia, EventoTipo } from '@/lib/types/eventos';

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
  const [tags, setTags] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('EVENTO');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [cupo, setCupo] = useState('');
  const [esPublico, setEsPublico] = useState('true');
  const [espacioId, setEspacioId] = useState<string>(NO_ESPACIO);
  const [recurrencia, setRecurrencia] = useState<EventoRecurrencia>('NONE');
  const [repeticiones, setRepeticiones] = useState('4');
  const [generandoIA, setGenerandoIA] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo(evento?.titulo ?? '');
      setDescripcion(evento?.descripcion ?? '');
      setTags(evento?.tags ?? '');
      setTipo(evento?.tipo ?? 'EVENTO');
      setInicio(isoToLocalInput(evento?.inicio));
      setFin(isoToLocalInput(evento?.fin));
      setCupo(evento?.cupo != null ? String(evento.cupo) : '');
      setEsPublico(evento?.esPublico === false ? 'false' : 'true');
      setEspacioId(evento?.espacioId != null ? String(evento.espacioId) : NO_ESPACIO);
      setRecurrencia('NONE');
      setRepeticiones('4');
    }
  }, [open, evento]);

  const generarConIA = async () => {
    const idea = titulo.trim() || descripcion.trim();
    if (!idea) {
      toast.error('Escribí una idea o título primero', { description: 'La IA la usa como punto de partida.' });
      return;
    }
    try {
      setGenerandoIA(true);
      const res = await postGenerarEvento({ idea, tipo });
      const data = res.data;
      // ai-svc devuelve {status:"error"} cuando está caído; lo detectamos por la falta de título.
      if (!data || (!data.titulo && !data.descripcion)) {
        toast.error('La IA no está disponible', { description: 'Verificá que ai-svc esté arriba e intentá de nuevo.' });
        return;
      }
      if (data.titulo) setTitulo(data.titulo);
      if (data.descripcion) setDescripcion(data.descripcion);
      if (data.tags) setTags(data.tags);
      toast.success('Contenido generado con IA', { description: 'Revisalo y ajustá lo que quieras.' });
    } catch (error: unknown) {
      toast.error('No se pudo generar con IA', { description: error instanceof Error ? error.message : 'Error' });
    } finally {
      setGenerandoIA(false);
    }
  };

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
      tags: tags.trim() || undefined,
      tipo,
      inicio: localInputToIso(inicio),
      fin: fin ? localInputToIso(fin) : undefined,
      cupo: cupo.trim() ? Number(cupo) : undefined,
      esPublico: esPublico === 'true',
      espacioId: espacioId !== NO_ESPACIO ? Number(espacioId) : undefined,
      // Recurrencia solo aplica al crear (genera N eventos de una).
      ...(!isEditing && recurrencia !== 'NONE'
        ? { recurrencia, repeticiones: Math.max(1, Number(repeticiones) || 1) }
        : {}),
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
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-cyan/10 text-utec-cyan">
              <CalendarPlus className="h-4 w-4" />
            </span>
            {isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del evento seleccionado.'
              : 'Completa los datos para publicar un nuevo evento u oferta abierta.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="evento-titulo">Título</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 border-utec-cyan/40 text-utec-cyan hover:bg-utec-cyan/10"
                onClick={generarConIA}
                disabled={loading || generandoIA}
                title="Genera título, descripción y tags con IA a partir de una idea"
              >
                {generandoIA ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generar con IA
              </Button>
            </div>
            <Input
              id="evento-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Charla de IA aplicada"
              disabled={loading}
              required
            />
            <p className="text-2xs text-muted-foreground">
              Escribí una idea o título y usá <b>Generar con IA</b> para completar descripción y tags.
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="evento-tags" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />Tags (separados por coma)
            </Label>
            <Input
              id="evento-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: IA, Workshop, Gratuito"
              disabled={loading}
            />
            {tags.trim() && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 text-utec-blue px-2 py-0.5 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}
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

          {!isEditing && (
            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />Repetir
                  </Label>
                  <Select value={recurrencia} onValueChange={(v) => setRecurrencia(v as EventoRecurrencia)} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No repetir</SelectItem>
                      <SelectItem value="DIARIA">Diariamente</SelectItem>
                      <SelectItem value="SEMANAL">Semanalmente</SelectItem>
                      <SelectItem value="MENSUAL">Mensualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recurrencia !== 'NONE' && (
                  <div className="space-y-2">
                    <Label htmlFor="evento-repeticiones">Cantidad de fechas</Label>
                    <Input
                      id="evento-repeticiones"
                      type="number"
                      min={2}
                      max={52}
                      value={repeticiones}
                      onChange={(e) => setRepeticiones(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
              {recurrencia !== 'NONE' && (
                <p className="text-2xs text-muted-foreground">
                  Se crearán <b>{Math.max(1, Number(repeticiones) || 1)}</b> eventos repitiendo el horario de inicio.
                </p>
              )}
            </div>
          )}
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

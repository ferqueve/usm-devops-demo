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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Clock, GraduationCap, Lightbulb, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { tutoriasApi } from '@/lib/api/tutorias';
import { materiasApi } from '@/lib/api/materias';
import { useAuth } from '@/hooks/useAuth';
import { useEspacios } from '@/hooks/useEspacios';
import type { Materia } from '@/lib/types/materias';
import type { Tutoria } from '@/lib/types/tutorias';

interface TutoriaFormDialogProps {
  tutoria: Tutoria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tutoria: Tutoria) => void;
  /** Preselecciona una materia al crear (ej. desde el detalle de materia). */
  defaultMateriaId?: number;
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

export function TutoriaFormDialog({
  tutoria,
  open,
  onOpenChange,
  onSuccess,
  defaultMateriaId,
}: Readonly<TutoriaFormDialogProps>) {
  const isEditing = !!tutoria;
  const { user } = useAuth();
  const { espacios } = useEspacios();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [loading, setLoading] = useState(false);

  const [materiaId, setMateriaId] = useState<string>('');
  const [espacioId, setEspacioId] = useState<string>(NO_ESPACIO);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [cupo, setCupo] = useState('');
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [enlace, setEnlace] = useState('');
  const [tipo, setTipo] = useState<'INDIVIDUAL' | 'GRUPAL'>('GRUPAL');
  const [tags, setTags] = useState('');
  const [recurrencia, setRecurrencia] = useState<'NONE' | 'DIARIA' | 'SEMANAL' | 'MENSUAL'>('NONE');
  const [repeticiones, setRepeticiones] = useState('4');
  const [sugerencia, setSugerencia] = useState<{ dow: number; hour: number; label: string } | null>(null);

  // Sugerencia de horario óptimo: día×hora con más demanda histórica.
  useEffect(() => {
    if (!open || isEditing) { setSugerencia(null); return; }
    tutoriasApi.listar().then((r) => {
      const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
      (r.data ?? []).forEach((t) => {
        const d = new Date(t.inicio);
        if (Number.isNaN(d.getTime())) return;
        const dow = (d.getDay() + 6) % 7;
        grid[dow][d.getHours()] += 1 + (t.agendadosCount ?? 0);
      });
      let best = { dow: -1, hour: -1, v: 0 };
      for (let dw = 0; dw < 7; dw++) for (let h = 8; h <= 20; h++) if (grid[dw][h] > best.v) best = { dow: dw, hour: h, v: grid[dw][h] };
      const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      setSugerencia(best.v > 0 ? { dow: best.dow, hour: best.hour, label: `${dias[best.dow]} a las ${String(best.hour).padStart(2, '0')}:00` } : null);
    }).catch(() => setSugerencia(null));
  }, [open, isEditing]);

  const aplicarSugerencia = () => {
    if (!sugerencia) return;
    const now = new Date();
    const curDow = (now.getDay() + 6) % 7;
    let add = (sugerencia.dow - curDow + 7) % 7;
    if (add === 0 && now.getHours() >= sugerencia.hour) add = 7;
    const target = new Date(now);
    target.setDate(now.getDate() + add);
    target.setHours(sugerencia.hour, 0, 0, 0);
    const end = new Date(target.getTime() + 3600_000);
    setInicio(isoToLocalInput(target.toISOString()));
    setFin(isoToLocalInput(end.toISOString()));
  };

  // Trae las materias según el rol: el docente ve las suyas, admin/analista todas.
  // Además garantiza que la materia preseleccionada esté siempre en la lista.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingMaterias(true);
    const base = user?.rol === 'DOCENTE'
      ? materiasApi.obtenerMateriasQueDicto()
      : materiasApi.obtenerMaterias();
    base
      .then(async (res) => {
        let list = (res.data ?? []).filter((m) => !m.deletedAt);
        if (defaultMateriaId != null && !list.some((m) => m.id === defaultMateriaId)) {
          try {
            const r = await materiasApi.obtenerMateria(defaultMateriaId);
            if (r.data) list = [r.data, ...list];
          } catch { /* ignore */ }
        }
        if (active) setMaterias(list);
      })
      .catch((err: unknown) => {
        const description = err instanceof Error ? err.message : 'No se pudieron cargar las materias';
        toast.error('Error al cargar materias', { description });
      })
      .finally(() => { if (active) setLoadingMaterias(false); });
    return () => { active = false; };
  }, [open, user?.rol, defaultMateriaId]);

  useEffect(() => {
    if (open) {
      setMateriaId(
        tutoria?.materiaId != null
          ? String(tutoria.materiaId)
          : defaultMateriaId != null ? String(defaultMateriaId) : '',
      );
      setEspacioId(tutoria?.espacioId != null ? String(tutoria.espacioId) : NO_ESPACIO);
      setInicio(isoToLocalInput(tutoria?.inicio));
      setFin(isoToLocalInput(tutoria?.fin));
      setCupo(tutoria?.cupo != null ? String(tutoria.cupo) : '');
      setModalidad(tutoria?.modalidad ?? 'PRESENCIAL');
      setEnlace(tutoria?.enlace ?? '');
      setTipo(tutoria?.tipo ?? 'GRUPAL');
      setTags(tutoria?.tags ?? '');
      setRecurrencia('NONE');
      setRepeticiones('4');
    }
  }, [open, tutoria, defaultMateriaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId) {
      toast.error('La materia es requerida');
      return;
    }
    if (!inicio || !fin) {
      toast.error('Las fechas de inicio y fin son requeridas');
      return;
    }
    const cupoNum = Number(cupo);
    if (!cupo.trim() || Number.isNaN(cupoNum) || cupoNum <= 0) {
      toast.error('El cupo debe ser mayor que cero');
      return;
    }

    try {
      setLoading(true);
      const espacioIdNum = espacioId !== NO_ESPACIO ? Number(espacioId) : undefined;
      let response;
      const comun = {
        materiaId: Number(materiaId),
        inicio: localInputToIso(inicio),
        fin: localInputToIso(fin),
        cupo: cupoNum,
        modalidad,
        enlace: modalidad === 'VIRTUAL' ? (enlace.trim() || undefined) : undefined,
        tipo,
        tags: tags.trim() || undefined,
      };
      if (isEditing && tutoria) {
        response = await tutoriasApi.actualizar(tutoria.id, { ...comun, espacioId: espacioIdNum ?? null });
      } else {
        response = await tutoriasApi.crear({
          ...comun,
          espacioId: espacioIdNum,
          ...(recurrencia !== 'NONE' ? { recurrencia, repeticiones: Math.max(1, Number(repeticiones) || 1) } : {}),
        });
      }
      if (response.data) {
        toast.success(isEditing ? 'Tutoría actualizada' : 'Tutoría creada');
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo guardar la tutoría';
      toast.error(isEditing ? 'Error al actualizar tutoría' : 'Error al crear tutoría', { description });
    } finally {
      setLoading(false);
    }
  };

  const lockedMateria = !isEditing && defaultMateriaId != null;
  const selectedMateria = materias.find((m) => String(m.id) === materiaId);
  const duracion = (() => {
    if (!inicio || !fin) return null;
    const ms = new Date(fin).getTime() - new Date(inicio).getTime();
    if (Number.isNaN(ms) || ms <= 0) return null;
    const mins = Math.round(ms / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}min` : (h > 0 ? '' : '0min')}`.trim();
  })();

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-blue/10 text-utec-blue">
              <GraduationCap className="h-4 w-4" />
            </span>
            {isEditing ? 'Editar tutoría' : 'Nueva tutoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modificá los datos de la franja de tutoría.'
              : 'Definí el horario y el cupo. Los estudiantes podrán agendarse hasta llenar las plazas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Materia</Label>
            {lockedMateria ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <BookOpen className="h-4 w-4 text-utec-blue shrink-0" />
                <span className="font-medium truncate">{selectedMateria?.nombre ?? 'Materia seleccionada'}</span>
              </div>
            ) : materias.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2.5">
                {loadingMaterias ? 'Cargando materias…' : 'No hay materias disponibles para crear tutorías.'}
              </p>
            ) : (
            <Select value={materiaId} onValueChange={setMateriaId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una materia" />
              </SelectTrigger>
              <SelectContent>
                {materias.map((materia) => (
                  <SelectItem key={materia.id} value={String(materia.id)}>
                    {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tutoria-inicio">Inicio</Label>
              <Input
                id="tutoria-inicio"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutoria-fin">Fin</Label>
              <Input
                id="tutoria-fin"
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {duracion && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground -mt-1">
              <Clock className="h-3.5 w-3.5" />Duración: <span className="font-medium text-foreground">{duracion}</span>
            </p>
          )}

          {!isEditing && sugerencia && (
            <div className="flex items-center gap-2 rounded-lg border border-utec-yellow/40 bg-utec-yellow/5 px-3 py-2 text-sm -mt-1">
              <Lightbulb className="h-4 w-4 text-utec-yellow shrink-0" />
              <span className="flex-1">Los <b>{sugerencia.label}</b> suelen tener más demanda.</span>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={aplicarSugerencia} disabled={loading}>Usar</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tutoria-cupo">Cupo</Label>
              <Input
                id="tutoria-cupo"
                type="number"
                min={1}
                value={cupo}
                onChange={(e) => setCupo(e.target.value)}
                placeholder="Ej: 5"
                disabled={loading}
                required
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modalidad</Label>
              <Select value={modalidad} onValueChange={(v) => setModalidad(v as 'PRESENCIAL' | 'VIRTUAL')} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'INDIVIDUAL' | 'GRUPAL')} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRUPAL">Grupal</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual (1 a 1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {modalidad === 'VIRTUAL' && (
            <div className="space-y-2">
              <Label htmlFor="tutoria-enlace">Enlace de videollamada</Label>
              <Input id="tutoria-enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://meet.google.com/…" disabled={loading} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tutoria-tags">Temas / tags (coma)</Label>
            <Input id="tutoria-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ej: Integrales, Parcial, mate" disabled={loading} />
            {tags.trim() && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full bg-utec-blue/10 text-utec-blue px-2 py-0.5 text-xs font-medium">
                    {t.toLowerCase() === 'mate' ? '🧉 mate' : t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="rounded-lg border border-dashed p-3 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Repetir (office hours)</Label>
                <Select value={recurrencia} onValueChange={(v) => setRecurrencia(v as typeof recurrencia)} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No repetir</SelectItem>
                    <SelectItem value="SEMANAL">Cada semana</SelectItem>
                    <SelectItem value="DIARIA">Cada día</SelectItem>
                    <SelectItem value="MENSUAL">Cada mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recurrencia !== 'NONE' && (
                <div className="space-y-2">
                  <Label htmlFor="tutoria-rep">Cantidad de fechas</Label>
                  <Input id="tutoria-rep" type="number" min={2} max={52} value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)} disabled={loading} />
                </div>
              )}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={[isEditing ? 'tutoria:editar' : 'tutoria:crear']}>
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

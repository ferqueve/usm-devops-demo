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
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { tutoriasApi } from '@/lib/api/tutorias';
import { materiasApi } from '@/lib/api/materias';
import { useEspacios } from '@/hooks/useEspacios';
import type { Materia } from '@/lib/types/materias';
import type { Tutoria } from '@/lib/types/tutorias';

interface TutoriaFormDialogProps {
  tutoria: Tutoria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tutoria: Tutoria) => void;
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
}: Readonly<TutoriaFormDialogProps>) {
  const isEditing = !!tutoria;
  const { espacios } = useEspacios();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(false);

  const [materiaId, setMateriaId] = useState<string>('');
  const [espacioId, setEspacioId] = useState<string>(NO_ESPACIO);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [cupo, setCupo] = useState('');

  // Traer las materias del docente para el selector
  useEffect(() => {
    if (!open) return;
    materiasApi
      .obtenerMisMaterias()
      .then((res) => setMaterias(res.data ?? []))
      .catch((err: unknown) => {
        const description = err instanceof Error ? err.message : 'No se pudieron cargar las materias';
        toast.error('Error al cargar materias', { description });
      });
  }, [open]);

  useEffect(() => {
    if (open) {
      setMateriaId(tutoria?.materiaId != null ? String(tutoria.materiaId) : '');
      setEspacioId(tutoria?.espacioId != null ? String(tutoria.espacioId) : NO_ESPACIO);
      setInicio(isoToLocalInput(tutoria?.inicio));
      setFin(isoToLocalInput(tutoria?.fin));
      setCupo(tutoria?.cupo != null ? String(tutoria.cupo) : '');
    }
  }, [open, tutoria]);

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
      if (isEditing && tutoria) {
        response = await tutoriasApi.actualizar(tutoria.id, {
          materiaId: Number(materiaId),
          espacioId: espacioIdNum ?? null,
          inicio: localInputToIso(inicio),
          fin: localInputToIso(fin),
          cupo: cupoNum,
        });
      } else {
        response = await tutoriasApi.crear({
          materiaId: Number(materiaId),
          espacioId: espacioIdNum,
          inicio: localInputToIso(inicio),
          fin: localInputToIso(fin),
          cupo: cupoNum,
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

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tutoría' : 'Crear Nueva Tutoría'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la franja de tutoría seleccionada.'
              : 'Completa los datos para publicar una nueva franja de tutoría.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Materia</Label>
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

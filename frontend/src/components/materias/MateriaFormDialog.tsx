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
import { materiasApi } from '@/lib/api/materias';
import { useCarreras } from '@/hooks/useCarreras';
import type { Materia } from '@/lib/types/materias';

interface MateriaFormDialogProps {
  materia: Materia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (materia: Materia) => void;
}

export function MateriaFormDialog({
  materia,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<MateriaFormDialogProps>) {
  const isEditing = !!materia;
  const { carreras } = useCarreras();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [semestre, setSemestre] = useState('');
  const [creditos, setCreditos] = useState('');

  const carrerasActivas = carreras.filter((c) => !c.deletedAt);

  useEffect(() => {
    if (open) {
      setNombre(materia?.nombre ?? '');
      setCodigo(materia?.codigo ?? '');
      setDescripcion(materia?.descripcion ?? '');
      setCarreraId(materia?.carreraId != null ? String(materia.carreraId) : '');
      setSemestre(materia?.semestre != null ? String(materia.semestre) : '');
      setCreditos(materia?.creditos != null ? String(materia.creditos) : '');
    }
  }, [open, materia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre de la materia es requerido');
      return;
    }
    if (!carreraId) {
      toast.error('La carrera es requerida');
      return;
    }
    try {
      setLoading(true);
      const data = {
        nombre: nombre.trim(),
        codigo: codigo.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        carreraId: Number(carreraId),
        semestre: semestre ? Number(semestre) : undefined,
        creditos: creditos ? Number(creditos) : undefined,
      };
      const response = isEditing && materia
        ? await materiasApi.actualizarMateria(materia.id, data)
        : await materiasApi.crearMateria(data);
      if (response.data) {
        toast.success(isEditing ? 'Materia actualizada' : 'Materia creada');
        onSuccess(response.data);
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'No se pudo guardar la materia';
      toast.error(isEditing ? 'Error al actualizar materia' : 'Error al crear materia', { description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (loading ? undefined : onOpenChange(value))}>
      <DialogContent className="sm:max-w-[560px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Materia' : 'Crear Nueva Materia'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la materia seleccionada.'
              : 'Completa los datos para crear una nueva materia.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="materia-nombre">Nombre de la Materia</Label>
            <Input
              id="materia-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Programación I"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materia-codigo">Código (Opcional)</Label>
              <Input
                id="materia-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: PROG-1"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia-carrera">Carrera</Label>
              <Select value={carreraId} onValueChange={setCarreraId} disabled={loading}>
                <SelectTrigger id="materia-carrera">
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  {carrerasActivas.map((carrera) => (
                    <SelectItem key={carrera.id} value={String(carrera.id)}>
                      {carrera.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materia-semestre">Semestre (Opcional)</Label>
              <Input
                id="materia-semestre"
                type="number"
                min={1}
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                placeholder="Ej: 1"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia-creditos">Créditos (Opcional)</Label>
              <Input
                id="materia-creditos"
                type="number"
                min={0}
                value={creditos}
                onChange={(e) => setCreditos(e.target.value)}
                placeholder="Ej: 6"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materia-descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="materia-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción de la materia"
              disabled={loading}
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <PermissionGuard requiredPermissions={[isEditing ? 'materia:editar' : 'materia:crear']}>
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

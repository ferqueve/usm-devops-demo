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
import { materiasApi } from '@/lib/api/materias';
import type { Inscripcion, Materia } from '@/lib/types/materias';

interface InscriptosDialogProps {
  materia: Materia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InscriptosDialog({ materia, open, onOpenChange }: Readonly<InscriptosDialogProps>) {
  const [inscriptos, setInscriptos] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !materia) return;
    let active = true;
    setLoading(true);
    materiasApi
      .obtenerInscriptos(materia.id)
      .then((response) => {
        if (active) setInscriptos(response.data ?? []);
      })
      .catch((error: unknown) => {
        const description = error instanceof Error ? error.message : 'No se pudieron cargar los inscriptos';
        toast.error('Error al cargar inscriptos', { description });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, materia]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Inscriptos {materia ? `- ${materia.nombre}` : ''}</DialogTitle>
          <DialogDescription>
            Estudiantes inscriptos activamente en la materia.
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
                  <p className="text-muted-foreground">No hay estudiantes inscriptos</p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {inscriptos.map((inscripcion) => (
                  <div
                    key={inscripcion.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{inscripcion.estudianteNombre}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {inscripcion.estado}
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

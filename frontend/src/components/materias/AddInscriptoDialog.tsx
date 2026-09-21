import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { usuariosApi } from '@/lib/api/users';
import { materiasApi } from '@/lib/api/materias';
import type { User } from '@/lib/types/users';

interface AddInscriptoDialogProps {
  materiaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddInscriptoDialog({ materiaId, open, onOpenChange, onSuccess }: Readonly<AddInscriptoDialogProps>) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) { setSearch(''); setUsers([]); return; }
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      usuariosApi.listarUsuarios(0, 8, { search: search || undefined, rol: 'ESTUDIANTE' })
        .then((r) => { if (active) setUsers(r.data?.content ?? []); })
        .catch(() => { /* silencioso */ })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [open, search]);

  const inscribir = async (u: User) => {
    try {
      setSavingId(u.id);
      await materiasApi.inscribirEstudiante(materiaId, u.id);
      toast.success('Estudiante inscripto', { description: u.nombre });
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error('No se pudo inscribir', { description: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-blue/10 text-marca-azul-texto"><UserPlus className="h-4 w-4" /></span>
            Inscribir estudiante
          </DialogTitle>
          <DialogDescription>Buscá un estudiante para inscribirlo en la materia.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input autoFocus placeholder="Buscar por nombre o email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>

        <div className="min-h-[180px]">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Sin estudiantes para mostrar.</p>
          ) : (
            <ul className="space-y-1.5">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Button size="sm" onClick={() => inscribir(u)} disabled={savingId === u.id}>
                    {savingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

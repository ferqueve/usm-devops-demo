import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usuariosApi } from '@/lib/api/users';
import type { User, UpdateUserData } from '@/lib/types/users';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedUser: User) => void;
}

export function EditUserDialog({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserData>({
    email: '',
    nombre: ''
  });

  // Actualizar formData cuando cambia el usuario
  useState(() => {
    if (user) {
      setFormData({
        email: user.email,
        nombre: user.nombre
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validaciones básicas
    if (!formData.email?.trim()) {
      toast.error('El email es requerido');
      return;
    }

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('El formato del email no es válido');
      return;
    }

    try {
      setLoading(true);
      const response = await usuariosApi.actualizarUsuario(user.id, formData);
      
      toast.success('Usuario actualizado', {
        description: `${formData.nombre} ha sido actualizado exitosamente`
      });
      
      if (response.data) {
        onSuccess(response.data);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario', {
        description: error.message || 'No se pudo actualizar el usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica la información de {user.nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre del usuario"
              disabled={loading}
              required
            />
          </div>

          {/* Información adicional del usuario */}
          <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-medium">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol actual:</span>
              <span className="font-medium">{user.rolApp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-medium">{user.activo ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.email?.trim() || !formData.nombre?.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { preferencesApi, type PreferenciasEmail, type PreferenciasVista, type PreferenciasEmailResponse, type PreferenciasVistaResponse } from '@/lib/api/preferences';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mapeo de tipos de email a etiquetas (solo configurables, sin emails obligatorios del admin)
const EMAIL_LABELS: Record<string, string> = {
  reservaAprobada: 'Reserva aprobada',
  reservaRechazada: 'Reserva rechazada',
  reservaCancelada: 'Reserva cancelada',
  reservaActualizada: 'Reserva actualizada',
  nuevaSolicitudReserva: 'Nueva solicitud de reserva',
  recordatorioReserva: 'Recordatorio de reserva',
  nuevaSolicitudInventario: 'Nueva solicitud de inventario',
  estadoSolicitudInventario: 'Estado de solicitud de inventario',
};

export default function PreferencesModal({ open, onOpenChange }: PreferencesModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<PreferenciasEmail>({});
  const [vistaPrefs, setVistaPrefs] = useState<PreferenciasVista>({});

  // Cargar preferencias al abrir el modal
  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // UNA SOLA LLAMADA para evitar que se creen dos configuraciones cuando el usuario es nuevo
      const response = await preferencesApi.obtenerPreferencias();
      const data = (response.data || response) as { preferencias: { email?: PreferenciasEmail; vista?: PreferenciasVista } };
      
      if (data && data.preferencias) {
        if (data.preferencias.email) {
          setEmailPrefs(data.preferencias.email);
        }
        if (data.preferencias.vista) {
          setVistaPrefs(data.preferencias.vista);
        }
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (key: string, value: boolean) => {
    setEmailPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleVistaChange = (key: string, value: string | number) => {
    setVistaPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        preferencesApi.actualizarPreferenciasEmail({ email: emailPrefs }),
        preferencesApi.actualizarPreferenciasVista({ vista: vistaPrefs }),
      ]);
      toast.success('Preferencias guardadas correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  // Obtener las claves de email desde las preferencias cargadas (ya vienen filtradas del backend)
  const filteredEmailKeys = useMemo(() => {
    return Object.keys(emailPrefs);
  }, [emailPrefs]);

  // Determinar qué secciones de vista mostrar según el rol
  const puedeVerSeccion = (seccion: 'reservas' | 'espacios' | 'inventario' | 'usuarios' | 'auditoria') => {
    if (!user?.rol) return false;
    
    if (user.rol === ROLES.ADMIN) return true;
    
    switch (seccion) {
      case 'reservas':
        return user.rol === ROLES.ANALISTA || user.rol === ROLES.DOCENTE;
      case 'espacios':
        return user.rol === ROLES.ANALISTA || user.rol === ROLES.MANTENIMIENTO;
      case 'inventario':
        return user.rol === ROLES.ANALISTA || user.rol === ROLES.MANTENIMIENTO;
      case 'usuarios':
      case 'auditoria':
        return false; // Solo ADMIN
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferencias de Usuario</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sección de Notificaciones por Email */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Notificaciones por Email</Label>
              {filteredEmailKeys.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <p>No hay preferencias de email configurables para tu rol.</p>
                  <p className="text-xs mt-2">Los emails del administrador siempre están activos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmailKeys.map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={emailPrefs[key] ?? true}
                        onCheckedChange={(checked) => handleEmailChange(key, checked as boolean)}
                      />
                      <Label
                        htmlFor={key}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {EMAIL_LABELS[key] || key}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección de Preferencias de Vista */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Preferencias de Vista</Label>
              <div className="space-y-4">
                {/* Preferencias de Reservas */}
                {puedeVerSeccion('reservas') && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Reservas</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reservasViewMode" className="text-xs text-muted-foreground">
                        Modo de vista
                      </Label>
                      <Select
                        value={vistaPrefs.reservasViewMode || 'calendar'}
                        onValueChange={(value) => handleVistaChange('reservasViewMode', value)}
                      >
                        <SelectTrigger id="reservasViewMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cards">Tarjetas</SelectItem>
                          <SelectItem value="table">Tabla</SelectItem>
                          <SelectItem value="calendar">Calendario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reservasCalendarViewMode" className="text-xs text-muted-foreground">
                        Vista de calendario
                      </Label>
                      <Select
                        value={vistaPrefs.reservasCalendarViewMode || 'week'}
                        onValueChange={(value) => handleVistaChange('reservasCalendarViewMode', value)}
                      >
                        <SelectTrigger id="reservasCalendarViewMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Día</SelectItem>
                          <SelectItem value="week">Semana</SelectItem>
                          <SelectItem value="month">Mes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reservasPageSize" className="text-xs text-muted-foreground">
                        Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.reservasPageSize || 10)}
                        onValueChange={(value) => handleVistaChange('reservasPageSize', parseInt(value))}
                      >
                        <SelectTrigger id="reservasPageSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                )}

                {/* Preferencias de Espacios */}
                {puedeVerSeccion('espacios') && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Espacios</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="espaciosViewMode" className="text-xs text-muted-foreground">
                        Modo de vista
                      </Label>
                      <Select
                        value={vistaPrefs.espaciosViewMode || 'cards'}
                        onValueChange={(value) => handleVistaChange('espaciosViewMode', value)}
                      >
                        <SelectTrigger id="espaciosViewMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cards">Tarjetas</SelectItem>
                          <SelectItem value="table">Tabla</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="espaciosPageSize" className="text-xs text-muted-foreground">
                        Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.espaciosPageSize || 12)}
                        onValueChange={(value) => handleVistaChange('espaciosPageSize', parseInt(value))}
                      >
                        <SelectTrigger id="espaciosPageSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                          <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                )}

                {/* Preferencias de Inventario */}
                {puedeVerSeccion('inventario') && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Inventario</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventarioViewMode" className="text-xs text-muted-foreground">
                        Modo de vista
                      </Label>
                      <Select
                        value={vistaPrefs.inventarioViewMode || 'table'}
                        onValueChange={(value) => handleVistaChange('inventarioViewMode', value)}
                      >
                        <SelectTrigger id="inventarioViewMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Tabla</SelectItem>
                          <SelectItem value="cards">Tarjetas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventarioPageSize" className="text-xs text-muted-foreground">
                        Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.inventarioPageSize || 25)}
                        onValueChange={(value) => handleVistaChange('inventarioPageSize', parseInt(value))}
                      >
                        <SelectTrigger id="inventarioPageSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                )}

                {/* Otras preferencias - Solo ADMIN */}
                {puedeVerSeccion('usuarios') && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Otras</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usuariosPageSize" className="text-xs text-muted-foreground">
                        Usuarios - Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.usuariosPageSize || 10)}
                        onValueChange={(value) => handleVistaChange('usuariosPageSize', parseInt(value))}
                      >
                        <SelectTrigger id="usuariosPageSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {puedeVerSeccion('auditoria') && (
                    <div className="space-y-2">
                      <Label htmlFor="auditoriaPageSize" className="text-xs text-muted-foreground">
                        Auditoría - Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.auditoriaPageSize || 20)}
                        onValueChange={(value) => handleVistaChange('auditoriaPageSize', parseInt(value))}
                      >
                        <SelectTrigger id="auditoriaPageSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


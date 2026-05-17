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
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { preferencesApi, type PreferenciasEmail, type PreferenciasVista } from '@/lib/api/preferences';
import { ROLES } from '@/lib/config/constants';
import { usuariosApi } from '@/lib/api/users';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TermsAndPrivacyDialog } from '@/components/public/auth/TermsAndPrivacyDialog';
import type { User, UpdateProfileData } from '@/lib/types/users';

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordChangeInputs {
  currentPassword: string;
  password: string;
  confirmPassword: string;
  hasPassword: boolean;
}

// Valida los datos de cambio de contraseña; devuelve un mensaje de error o null si todo es válido
function validatePasswordChange({
  currentPassword,
  password,
  confirmPassword,
  hasPassword,
}: PasswordChangeInputs): string | null {
  const noChange = !password && !confirmPassword && !currentPassword;
  if (noChange) return null;
  if (hasPassword && currentPassword.trim().length === 0) {
    return 'Debes ingresar tu contraseña actual para cambiarla';
  }
  if (!password || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return null;
}

// Extrae el mensaje de error legible de una excepción (axios o Error nativo)
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
    return axiosError.response?.data?.error || axiosError.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
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

export default function PreferencesModal({ open, onOpenChange }: Readonly<PreferencesModalProps>) {
  const { user } = useAuth();
  const { hasPermission } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<PreferenciasEmail>({});
  const [vistaPrefs, setVistaPrefs] = useState<PreferenciasVista>({});
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsDialogTab, setTermsDialogTab] = useState<"terms" | "privacy">("terms");

  // Usar el campo hasPassword del backend para determinar si tiene contraseña
  const hasPassword = userProfile?.hasPassword === true;

  // Cargar preferencias al abrir el modal
  useEffect(() => {
    if (open) {
      loadPreferences();
      loadUserProfile();
      // Limpiar campos de contraseña al abrir
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSecurityExpanded(false);
    }
  }, [open]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // UNA SOLA LLAMADA para evitar que se creen dos configuraciones cuando el usuario es nuevo
      const response = await preferencesApi.obtenerPreferencias();
      const data = (response.data || response) as { preferencias: { email?: PreferenciasEmail; vista?: PreferenciasVista } };
      
      if (data?.preferencias) {
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

  const loadUserProfile = async () => {
    try {
      const response = await usuariosApi.obtenerPerfilPropio();
      // La respuesta puede venir en response.data o directamente
      const userData = response.data || response;
      if (userData && typeof userData === 'object' && 'email' in userData) {
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      // No mostrar error al usuario, solo loguear
    }
  };

  const handleEmailChange = (key: string, value: boolean) => {
    setEmailPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleVistaChange = (key: string, value: string | number) => {
    setVistaPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const validationError = validatePasswordChange({
      currentPassword,
      password,
      confirmPassword,
      hasPassword,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const isPasswordChange = Boolean(password && password === confirmPassword);

    try {
      setSaving(true);
      const promises: Promise<unknown>[] = [
        preferencesApi.actualizarPreferenciasEmail({ email: emailPrefs }),
        preferencesApi.actualizarPreferenciasVista({ vista: vistaPrefs }),
      ];

      if (isPasswordChange) {
        const updateData: UpdateProfileData = {
          password,
          ...(hasPassword && currentPassword ? { currentPassword } : {}),
        };
        promises.push(usuariosApi.actualizarPerfilPropio(updateData));
      }

      await Promise.all(promises);

      if (isPasswordChange) {
        if (userProfile) {
          setUserProfile({ ...userProfile, hasPassword: true });
        }
        await loadUserProfile();
      }

      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSecurityExpanded(false);

      toast.success('Preferencias guardadas correctamente');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error al guardar preferencias:', error);
      toast.error(extractErrorMessage(error, 'Error al guardar preferencias'));
    } finally {
      setSaving(false);
    }
  };

  // Obtener las claves de email desde las preferencias cargadas (ya vienen filtradas del backend)
  const filteredEmailKeys = useMemo(() => {
    return Object.keys(emailPrefs);
  }, [emailPrefs]);

  // Determinar qué secciones de vista mostrar según permisos
  const puedeVerSeccion = (seccion: 'reservas' | 'espacios' | 'inventario' | 'usuarios' | 'auditoria') => {
    switch (seccion) {
      case 'reservas':
        // Usuarios que pueden ver estadísticas o ver recomendaciones (ANALISTA, DOCENTE)
        return hasPermission('estadisticas:ver') || hasPermission('recomendacion:ver');
      case 'espacios':
        // Usuarios que pueden ver espacios (ANALISTA, MANTENIMIENTO, ADMIN)
        return hasPermission('espacio:ver');
      case 'inventario':
        // Usuarios que pueden ver inventario (ANALISTA, MANTENIMIENTO, ADMIN)
        return hasPermission('inventario:ver');
      case 'usuarios':
        // Solo usuarios que pueden gestionar usuarios (ADMIN)
        return hasPermission('usuario:gestionar');
      case 'auditoria':
        // Solo usuarios que pueden ver auditoría (ADMIN)
        return hasPermission('auditoria:ver');
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">Preferencias de Usuario</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personaliza las notificaciones, vistas por defecto y la seguridad de tu cuenta.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 divide-y">
            {/* Sección de Notificaciones por Email */}
            <section className="space-y-3 pb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Notificaciones por Email</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Elige qué eventos disparan correos hacia tu cuenta.
                </p>
              </div>
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
            </section>

            {/* Sección de Preferencias de Vista - Oculto para usuarios externos */}
            {user?.rol !== ROLES.EXTERNO && (
            <section className="space-y-3 py-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Preferencias de Vista</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cómo se presentan las distintas secciones al abrirlas.
                </p>
              </div>
              <div className="space-y-3">
                {/* Preferencias de Reservas */}
                {puedeVerSeccion('reservas') && (
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reservas</h4>
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
                        onValueChange={(value) => handleVistaChange('reservasPageSize', Number.parseInt(value))}
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
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Espacios</h4>
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
                        onValueChange={(value) => handleVistaChange('espaciosPageSize', Number.parseInt(value))}
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
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inventario</h4>
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
                        onValueChange={(value) => handleVistaChange('inventarioPageSize', Number.parseInt(value))}
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
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Otras</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usuariosPageSize" className="text-xs text-muted-foreground">
                        Usuarios - Tamaño de página
                      </Label>
                      <Select
                        value={String(vistaPrefs.usuariosPageSize || 10)}
                        onValueChange={(value) => handleVistaChange('usuariosPageSize', Number.parseInt(value))}
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
                        onValueChange={(value) => handleVistaChange('auditoriaPageSize', Number.parseInt(value))}
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
            </section>
            )}

            {/* Sección de Términos y Políticas */}
            <section className="space-y-3 py-5">
              <h3 className="text-sm font-semibold text-foreground">Términos y Políticas</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <Label className="text-sm font-medium">Términos y Condiciones</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consulta los términos y condiciones de uso del sistema
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTermsDialogTab("terms");
                      setShowTermsDialog(true);
                    }}
                  >
                    Ver Términos
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <Label className="text-sm font-medium">Política de Privacidad</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consulta cómo manejamos tus datos personales
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTermsDialogTab("privacy");
                      setShowTermsDialog(true);
                    }}
                  >
                    Ver Política
                  </Button>
                </div>
              </div>
            </section>

            {/* Sección de Seguridad - Colapsable */}
            <section className="space-y-3 pt-5">
              <Collapsible open={securityExpanded} onOpenChange={setSecurityExpanded}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Seguridad</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cambiá tu contraseña de inicio de sesión.
                    </p>
                  </div>
                  {securityExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-4 pt-2">
                  {userProfile?.oauthProv && !hasPassword && (
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Cuenta vinculada con Google
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Establece una contraseña para poder iniciar sesión también con email y contraseña.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {hasPassword && (
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-sm">
                          Contraseña actual <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Ingresa tu contraseña actual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={saving}
                          required
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm">
                        {hasPassword ? 'Nueva contraseña' : 'Contraseña'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPassword(value);
                          // Limpiar mensaje de error personalizado mientras se escribe
                          e.target.setCustomValidity('');
                        }}
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.validity.tooShort) {
                            target.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
                          } else if (target.validity.valueMissing) {
                            target.setCustomValidity('Este campo es obligatorio');
                          }
                        }}
                        minLength={8}
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm">
                        Confirmar contraseña
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConfirmPassword(value);
                          // Limpiar mensaje de error personalizado mientras se escribe
                          e.target.setCustomValidity('');
                        }}
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.validity.tooShort) {
                            target.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
                          } else if (target.validity.valueMissing) {
                            target.setCustomValidity('Este campo es obligatorio');
                          }
                        }}
                        minLength={8}
                        disabled={saving}
                      />
                    </div>
                    
                    {(password || confirmPassword) && password !== confirmPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
              </Collapsible>
            </section>

          </div>
          <div className="px-6 py-3 border-t bg-muted/30 flex justify-end gap-2 flex-shrink-0">
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
          </>
        )}
        
        {/* Diálogo de términos y política */}
        <TermsAndPrivacyDialog
          open={showTermsDialog}
          onOpenChange={setShowTermsDialog}
          defaultTab={termsDialogTab}
        />
      </DialogContent>
    </Dialog>
  );
}


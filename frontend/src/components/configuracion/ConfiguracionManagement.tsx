import PermissionGuard from '@/components/auth/PermissionGuard';
import { CarrerasManagement } from '@/components/carreras/CarrerasManagement';
import { TipoEspacioManagement } from '@/components/spaces/TipoEspacioManagement';

/**
 * Configuración: los catálogos que alimentan al resto del sistema. Cada sección
 * se muestra solo si el rol puede administrarla, porque los permisos no van
 * juntos: un ANALISTA administra carreras pero no tipos de espacio, y un
 * MANTENIMIENTO al revés.
 */
export default function ConfiguracionManagement() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Catálogos que definen las opciones disponibles en el resto del sistema.
      </p>

      <PermissionGuard requiredPermissions={['tipo:crear', 'tipo:editar']} requireAll={false}>
        <TipoEspacioManagement />
      </PermissionGuard>

      <PermissionGuard requiredPermissions={['carrera:crear', 'carrera:editar']} requireAll={false}>
        <CarrerasManagement />
      </PermissionGuard>
    </div>
  );
}

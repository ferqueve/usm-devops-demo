import PermissionGuard from '@/components/auth/PermissionGuard';
import { PageHeader } from '@/components/layouts/PageHeader';
import { CarrerasManagement } from '@/components/carreras/CarrerasManagement';
import { TipoElementoManagement } from '@/components/inventory/TipoElementoManagement';
import { TipoEspacioManagement } from '@/components/spaces/TipoEspacioManagement';

/**
 * Configuración: los catálogos que alimentan al resto del sistema. Cada sección
 * se muestra solo si el rol puede administrarla, porque los permisos no van
 * juntos: un ANALISTA administra carreras pero no tipos de espacio, y un
 * MANTENIMIENTO al revés.
 */
export default function ConfiguracionManagement() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Configuración"
        description="Catálogos que definen las opciones disponibles en el resto del sistema."
        accentColor="#00c7ff"
      />

      {/* Los dos catálogos de tipos van a la par: son listas cortas de nombres
          de una palabra, cada una sobra en media pantalla. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PermissionGuard requiredPermissions={['tipo:crear', 'tipo:editar']} requireAll={false}>
          <TipoEspacioManagement />
        </PermissionGuard>

        <PermissionGuard requiredPermissions={['tipo:crear', 'tipo:editar']} requireAll={false}>
          <TipoElementoManagement />
        </PermissionGuard>
      </div>

      {/* Carreras se lleva el ancho completo: son bastantes y con nombres largos
          ("Licenciatura en Análisis Alimentario") que en media fila se cortan. */}
      <PermissionGuard requiredPermissions={['carrera:crear', 'carrera:editar']} requireAll={false}>
        <CarrerasManagement />
      </PermissionGuard>
    </div>
  );
}

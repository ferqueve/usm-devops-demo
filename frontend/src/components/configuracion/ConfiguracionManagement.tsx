import { TipoEspacioManagement } from '@/components/spaces/TipoEspacioManagement';

/**
 * Configuración: los catálogos que alimentan al resto del sistema. Hoy son los
 * tipos de espacio; el layout está pensado para que sumar otro catálogo sea
 * agregar una sección más a esta columna.
 */
export default function ConfiguracionManagement() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Catálogos que definen las opciones disponibles en el resto del sistema.
      </p>

      <TipoEspacioManagement />
    </div>
  );
}

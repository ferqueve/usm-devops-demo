import { Building2, DoorOpen, Tag } from 'lucide-react';
import { ClearFiltersButton, PopoverFilterSection } from '@/components/ui/compact-filter';
import type { EstadoInventario, FiltrosInventario as Filtros } from '@/lib/api/stats';

interface Props {
  opciones: EstadoInventario['opciones'] | undefined;
  filtros: Filtros;
  activos: boolean;
  onCambiar: (cambios: Filtros) => void;
  onLimpiar: () => void;
}

/**
 * Filtros compactos, con el mismo estilo que el resto de la app.
 *
 * El espacio depende del edificio: elegir un edificio acota la lista, y un
 * espacio de otro edificio se descarta. No hay filtro por estado: el estado
 * se ve repartido en cada gráfico y tabla, y filtrarlo dejaba los indicadores
 * de estado en cero.
 */
export function FiltrosInventario({ opciones, filtros, activos, onCambiar, onLimpiar }: Readonly<Props>) {
  const edificios = opciones?.edificios ?? [];
  const nombreEdificio = new Map(edificios.map((e) => [e.id, e.nombre]));
  const espacios = (opciones?.espacios ?? []).filter(
    (e) => filtros.edificioId == null || e.padreId === filtros.edificioId,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PopoverFilterSection<number>
        selectedId={filtros.edificioId ?? null}
        items={edificios.map((e) => ({ id: e.id, primary: e.nombre }))}
        onChange={(edificioId) => {
          const espacio = opciones?.espacios.find((e) => e.id === filtros.espacioId);
          const espacioFuera = edificioId != null && espacio != null && espacio.padreId !== edificioId;
          onCambiar(espacioFuera ? { edificioId, espacioId: null } : { edificioId });
        }}
        Icon={Building2}
        tooltipNone="Todos los edificios"
      />
      <PopoverFilterSection<number>
        selectedId={filtros.espacioId ?? null}
        items={espacios.map((e) => ({
          id: e.id,
          primary: e.nombre,
          secondary: e.padreId == null ? undefined : nombreEdificio.get(e.padreId),
        }))}
        onChange={(espacioId) => onCambiar({ espacioId })}
        Icon={DoorOpen}
        tooltipNone={filtros.edificioId == null ? 'Todos los espacios' : 'Todos los espacios del edificio'}
        activeBgClass="bg-emerald-100 text-emerald-900 shadow-md ring-1 ring-emerald-300"
        activeTextColorClass="text-emerald-700"
      />
      <PopoverFilterSection<number>
        selectedId={filtros.tipoElementoId ?? null}
        items={(opciones?.tipos ?? []).map((t) => ({ id: t.id, primary: t.nombre }))}
        onChange={(tipoElementoId) => onCambiar({ tipoElementoId })}
        Icon={Tag}
        tooltipNone="Todos los tipos"
        activeBgClass="bg-purple-100 text-purple-900 shadow-md ring-1 ring-purple-300"
        activeTextColorClass="text-purple-700"
      />
      <ClearFiltersButton visible={activos} onClear={onLimpiar} />
    </div>
  );
}

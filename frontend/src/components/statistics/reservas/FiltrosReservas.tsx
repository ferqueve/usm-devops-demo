import { Building2, DoorOpen, GraduationCap, LayoutGrid, UserRound, X } from 'lucide-react';
import { ClearFiltersButton, PopoverFilterSection } from '@/components/ui/compact-filter';
import type { FiltrosReservas as Filtros, OpcionesReservas } from '@/lib/api/stats';
import { nombreRol, nombreRolPlural } from './formato';
import { espacioFuera } from './filtros';

interface Props {
  opciones: OpcionesReservas | null;
  filtros: Filtros;
  activos: boolean;
  onCambiar: (cambios: Filtros) => void;
  onLimpiar: () => void;
  /** Sin el filtro de rol (académico no lo usa). */
  sinRol?: boolean;
}

/**
 * Filtros compactos de reservas, con el mismo estilo que los de inventario.
 * El espacio depende del edificio y del tipo: elegirlos acota la lista y
 * descarta un espacio que ya no corresponde.
 */
export function FiltrosReservas({ opciones, filtros, activos, onCambiar, onLimpiar, sinRol = false }: Readonly<Props>) {
  const nombreEdificio = new Map((opciones?.edificios ?? []).map((e) => [e.id, e.nombre]));
  const espacios = (opciones?.espacios ?? []).filter(
    (e) =>
      (filtros.edificioId == null || e.edificioId === filtros.edificioId) &&
      (filtros.tipoEspacioId == null || e.tipoEspacioId === filtros.tipoEspacioId),
  );

  const cambiarAcotando = (cambios: Filtros) =>
    onCambiar(espacioFuera(opciones, filtros, cambios) ? { ...cambios, espacioId: null } : cambios);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <PopoverFilterSection<number>
        selectedId={filtros.edificioId ?? null}
        items={(opciones?.edificios ?? []).map((e) => ({ id: e.id, primary: e.nombre }))}
        onChange={(edificioId) => cambiarAcotando({ edificioId })}
        Icon={Building2}
        tooltipNone="Todos los edificios"
      />
      <PopoverFilterSection<number>
        selectedId={filtros.espacioId ?? null}
        items={espacios.map((e) => ({
          id: e.id,
          primary: e.nombre,
          secondary: e.edificioId == null ? undefined : nombreEdificio.get(e.edificioId),
        }))}
        onChange={(espacioId) => onCambiar({ espacioId })}
        Icon={DoorOpen}
        tooltipNone={filtros.edificioId == null ? 'Todos los espacios' : 'Todos los espacios del edificio'}
        activeBgClass="bg-success-suave text-success-texto shadow-md ring-1 ring-success-borde"
        activeTextColorClass="text-success-texto"
      />
      <PopoverFilterSection<number>
        selectedId={filtros.tipoEspacioId ?? null}
        items={(opciones?.tiposEspacio ?? []).map((t) => ({ id: t.id, primary: t.nombre }))}
        onChange={(tipoEspacioId) => cambiarAcotando({ tipoEspacioId })}
        Icon={LayoutGrid}
        tooltipNone="Todos los tipos de espacio"
        activeBgClass="bg-info-suave text-info-texto shadow-md ring-1 ring-info-borde"
        activeTextColorClass="text-info-texto"
      />
      {!sinRol && (
      <PopoverFilterSection<string>
        selectedId={filtros.rol ?? null}
        items={(opciones?.roles ?? []).map((r) => ({ id: r, primary: nombreRol(r) }))}
        onChange={(rol) => onCambiar({ rol })}
        Icon={UserRound}
        tooltipNone="Todos los roles"
        activeBgClass="bg-warning-suave text-warning-texto shadow-md ring-1 ring-warning-borde"
        activeTextColorClass="text-warning-texto"
      />
      )}
      <PopoverFilterSection<number>
        selectedId={filtros.carreraId ?? null}
        items={(opciones?.carreras ?? []).map((c) => ({ id: c.id, primary: c.nombre }))}
        onChange={(carreraId) => onCambiar({ carreraId })}
        Icon={GraduationCap}
        tooltipNone="Todas las carreras"
        activeBgClass="bg-acento-suave text-acento-texto shadow-md ring-1 ring-acento-borde"
        activeTextColorClass="text-acento-texto"
      />
      <ClearFiltersButton visible={activos} onClear={onLimpiar} />
    </div>
  );
}

/** Chips con los filtros aplicados, cada uno con su cruz. */
export function ChipsFiltros({ opciones, filtros, onCambiar }: Readonly<{ opciones: OpcionesReservas | null; filtros: Filtros; onCambiar: (c: Filtros) => void }>) {
  const nombre = (lista: Array<{ id: number; nombre: string }> | undefined, id: number) => lista?.find((o) => o.id === id)?.nombre ?? `#${id}`;
  const chips = [
    filtros.edificioId != null && { clave: 'edificioId', etiqueta: 'Edificio', valor: nombre(opciones?.edificios, filtros.edificioId) },
    filtros.espacioId != null && { clave: 'espacioId', etiqueta: 'Espacio', valor: nombre(opciones?.espacios, filtros.espacioId) },
    filtros.tipoEspacioId != null && { clave: 'tipoEspacioId', etiqueta: 'Tipo', valor: nombre(opciones?.tiposEspacio, filtros.tipoEspacioId) },
    filtros.rol && { clave: 'rol', etiqueta: 'Rol', valor: nombreRolPlural(filtros.rol) },
    filtros.carreraId != null && { clave: 'carreraId', etiqueta: 'Carrera', valor: nombre(opciones?.carreras, filtros.carreraId) },
  ].filter((c): c is { clave: keyof Filtros; etiqueta: string; valor: string } => Boolean(c));
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs" aria-label="Filtros aplicados">
      <span className="text-muted-foreground">Filtrando por</span>
      {chips.map((c) => (
        <span key={c.clave} className="inline-flex max-w-[260px] items-center gap-1 rounded-full border bg-card py-0.5 pl-2.5 pr-1 shadow-sm">
          <span className="text-muted-foreground">{c.etiqueta}:</span>
          <b className="truncate">{c.valor}</b>
          <button
            type="button"
            onClick={() => onCambiar({ [c.clave]: null })}
            aria-label={`Quitar filtro ${c.etiqueta}`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}


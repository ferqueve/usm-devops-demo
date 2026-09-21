import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, MapPin, ChevronLeft, ChevronRight, Moon, Loader2 } from 'lucide-react';
import type { Reserva } from '@/lib/types/spaces';
import { formatTime } from './reservationUtils';
import ReservationFilters from './ReservationFilters';
import { FullScreenToggle, ViewModeToggle } from './_shared/ReservationListChrome';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { usePreferences } from '@/hooks/usePreferences';

interface Espacio {
  id: number;
  nombre: string;
}

type CalendarViewMode = 'day' | 'week' | 'month';

interface Carrera {
  id: number;
  nombre: string;
  codigo?: string;
}

interface TipoEspacio {
  id: number;
  nombre: string;
  color?: string;
}

function getIntervalBorderClass(esHoraCompleta: boolean, esMediaHora: boolean): string {
  if (esHoraCompleta) return 'border-t border-border';
  if (esMediaHora) return 'border-t border-border';
  return 'border-t border-border';
}

interface PosicionVertical {
  topPercent: number;
  alturaPercent: number;
  minutosInicio: number;
  minutosFin: number;
}

interface RangoVisibleConfig {
  minutosInicioVisible: number;
  minutosFinVisible: number;
  minutosTotalesVisibles: number;
}

// Calcula posición vertical de una reserva en un timeline visible
function calcularPosicionVerticalReserva(reserva: Reserva, cfg: RangoVisibleConfig): PosicionVertical | null {
  const inicio = new Date(reserva.inicio);
  const fin = new Date(reserva.fin);
  const minutosInicio = inicio.getHours() * 60 + inicio.getMinutes();
  const minutosFin = fin.getHours() * 60 + fin.getMinutes();
  const minutosFinAjustados = minutosFin === 0 ? 24 * 60 : minutosFin;

  if (minutosFinAjustados <= cfg.minutosInicioVisible || minutosInicio >= cfg.minutosFinVisible) {
    return null;
  }

  const minutosInicioAjustados = Math.max(minutosInicio, cfg.minutosInicioVisible);
  const minutosFinAjustadosVisibles = Math.min(minutosFinAjustados, cfg.minutosFinVisible);
  const minutosDesdeInicioVisible = minutosInicioAjustados - cfg.minutosInicioVisible;
  const topPercent = (minutosDesdeInicioVisible / cfg.minutosTotalesVisibles) * 100;
  const alturaPercent =
    ((minutosFinAjustadosVisibles - minutosInicioAjustados) / cfg.minutosTotalesVisibles) * 100;
  return {
    topPercent,
    alturaPercent,
    minutosInicio: minutosInicioAjustados,
    minutosFin: minutosFinAjustadosVisibles,
  };
}

interface RangoMinutos { minutosInicio: number; minutosFin: number }

// Verifica si dos rangos de minutos se superponen
function haySuperposicion(a: RangoMinutos, b: RangoMinutos): boolean {
  return (
    (a.minutosInicio >= b.minutosInicio && a.minutosInicio < b.minutosFin) ||
    (a.minutosFin > b.minutosInicio && a.minutosFin <= b.minutosFin) ||
    (a.minutosInicio <= b.minutosInicio && a.minutosFin >= b.minutosFin) ||
    (b.minutosInicio <= a.minutosInicio && b.minutosFin >= a.minutosFin)
  );
}

// Encuentra los índices de los grupos que se superponen con la reserva dada
function encontrarGruposSuperpuestos<T extends RangoMinutos>(
  grupos: T[][],
  reserva: T
): number[] {
  const resultado: number[] = [];
  for (let i = 0; i < grupos.length; i++) {
    if (grupos[i].some(g => haySuperposicion(reserva, g))) {
      resultado.push(i);
    }
  }
  return resultado;
}

// Inserta una reserva en el conjunto de grupos, fusionando si hay superposiciones
function insertarReservaEnGrupos<T extends RangoMinutos>(grupos: T[][], reserva: T): void {
  const superpuestos = encontrarGruposSuperpuestos(grupos, reserva);
  if (superpuestos.length === 0) {
    grupos.push([reserva]);
    return;
  }
  const grupoFusionado = superpuestos.flatMap(idx => grupos[idx]);
  grupoFusionado.push(reserva);
  superpuestos.slice().reverse().forEach(idx => grupos.splice(idx, 1));
  grupos.push(grupoFusionado);
}

interface GrupoReservasPorRango {
  reservas: Reserva[];
  inicio: Date;
  fin: Date;
  minutosInicio: number;
  minutosFin: number;
  estado: string;
}

// Agrupa reservas con el mismo rango horario y mismo estado
function agruparReservasPorRangoYEstado(reservas: Reserva[]): GrupoReservasPorRango[] {
  const grupos: GrupoReservasPorRango[] = [];
  reservas.forEach(reserva => {
    const inicioReserva = new Date(reserva.inicio);
    const finReserva = new Date(reserva.fin);
    const minutosInicio = inicioReserva.getHours() * 60 + inicioReserva.getMinutes();
    const minutosFin = finReserva.getHours() * 60 + finReserva.getMinutes();
    const grupoExistente = grupos.find(g =>
      g.minutosInicio === minutosInicio &&
      g.minutosFin === minutosFin &&
      g.estado === reserva.estado
    );
    if (grupoExistente) {
      grupoExistente.reservas.push(reserva);
    } else {
      grupos.push({
        reservas: [reserva],
        inicio: inicioReserva,
        fin: finReserva,
        minutosInicio,
        minutosFin,
        estado: reserva.estado,
      });
    }
  });
  return grupos;
}

// Encuentra la primera columna sin solapamiento; retorna -1 si todas solapan
function encontrarColumnaDisponible(
  columnas: GrupoReservasPorRango[][],
  grupo: GrupoReservasPorRango
): number {
  for (let i = 0; i < columnas.length; i++) {
    const haySolapamiento = columnas[i].some(g =>
      grupo.minutosInicio < g.minutosFin && grupo.minutosFin > g.minutosInicio
    );
    if (!haySolapamiento) return i;
  }
  return -1;
}

// Distribuye los grupos en columnas según solapamientos
function distribuirGruposEnColumnas(grupos: GrupoReservasPorRango[]): GrupoReservasPorRango[][] {
  const columnas: GrupoReservasPorRango[][] = [];
  grupos.forEach(grupo => {
    const columnaEncontrada = encontrarColumnaDisponible(columnas, grupo);
    if (columnaEncontrada === -1) {
      columnas.push([grupo]);
    } else {
      columnas[columnaEncontrada].push(grupo);
    }
  });
  return columnas;
}

// Encuentra el índice de la columna donde está un grupo
function indiceColumnaDeGrupo(
  columnas: GrupoReservasPorRango[][],
  grupo: GrupoReservasPorRango
): number {
  for (let i = 0; i < columnas.length; i++) {
    const presente = columnas[i].some(g =>
      g.minutosInicio === grupo.minutosInicio &&
      g.minutosFin === grupo.minutosFin &&
      g.estado === grupo.estado
    );
    if (presente) return i;
  }
  return 0;
}

interface GrupoReservasConPosicion extends GrupoReservasPorRango {
  columna: number;
  totalColumnas: number;
}

// Calcula la distribución horizontal de grupos de reservas para un día
function calcularPosicionesReservasPorDia(reservasDia: Reserva[]): GrupoReservasConPosicion[] {
  if (reservasDia.length === 0) return [];
  const reservasOrdenadas = [...reservasDia].sort((a, b) =>
    new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );
  const grupos = agruparReservasPorRangoYEstado(reservasOrdenadas);
  const columnas = distribuirGruposEnColumnas(grupos);
  const totalColumnas = columnas.length;
  return grupos.map(grupo => ({
    ...grupo,
    columna: indiceColumnaDeGrupo(columnas, grupo),
    totalColumnas,
  }));
}

interface ColorConfig { bg: string; border: string; hoverBg: string; hoverBorder: string }

const PALETAS_RESERVA: Record<string, ColorConfig[]> = {
  CANCELADO: [
    { bg: 'bg-danger', border: 'border-danger', hoverBg: 'hover:bg-danger', hoverBorder: 'hover:border-danger' },
    { bg: 'bg-danger', border: 'border-danger', hoverBg: 'hover:bg-danger', hoverBorder: 'hover:border-danger' },
    { bg: 'bg-danger', border: 'border-danger', hoverBg: 'hover:bg-danger', hoverBorder: 'hover:border-danger' },
    { bg: 'bg-danger', border: 'border-danger', hoverBg: 'hover:bg-danger', hoverBorder: 'hover:border-danger' },
  ],
  PENDIENTE: [
    { bg: 'bg-warning', border: 'border-warning', hoverBg: 'hover:bg-warning', hoverBorder: 'hover:border-warning' },
    { bg: 'bg-warning', border: 'border-warning', hoverBg: 'hover:bg-warning', hoverBorder: 'hover:border-warning' },
    { bg: 'bg-warning', border: 'border-warning', hoverBg: 'hover:bg-warning', hoverBorder: 'hover:border-warning' },
    { bg: 'bg-warning', border: 'border-warning', hoverBg: 'hover:bg-warning', hoverBorder: 'hover:border-warning' },
  ],
  APROBADO: [
    { bg: 'bg-info', border: 'border-info', hoverBg: 'hover:bg-info', hoverBorder: 'hover:border-info' },
    { bg: 'bg-info', border: 'border-info', hoverBg: 'hover:bg-info', hoverBorder: 'hover:border-info' },
    { bg: 'bg-info', border: 'border-info', hoverBg: 'hover:bg-info', hoverBorder: 'hover:border-info' },
    { bg: 'bg-info', border: 'border-info', hoverBg: 'hover:bg-info', hoverBorder: 'hover:border-info' },
  ],
};

function getColorConfigByEstado(estado: string, columnaIndex: number): ColorConfig {
  const paleta = PALETAS_RESERVA[estado.toUpperCase()] ?? PALETAS_RESERVA.APROBADO;
  return paleta[columnaIndex % paleta.length];
}

// Genera una abreviación corta del nombre de un espacio para mostrar en barras estrechas.
// Mantiene el sufijo numérico cuando existe (clave para distinguir "Aula 8" de "Aula 11").
function abreviarNombreEspacio(nombre: string): string {
  if (!nombre) return '';
  const limpio = nombre.trim();
  const aula = limpio.match(/^aula\s+(\d+)$/i);
  if (aula) return `A${aula[1]}`;
  const aulaTeorica = limpio.match(/^aula\s+te[oó]rica\s+(\d+)$/i);
  if (aulaTeorica) return `AT${aulaTeorica[1]}`;
  const lab = limpio.match(/^laboratorio\s+(.+)$/i);
  if (lab) return `Lab. ${lab[1].slice(0, 4)}`;
  const sala = limpio.match(/^sala\s+(?:de\s+)?(.+)$/i);
  if (sala) return `S. ${sala[1].slice(0, 4)}`;
  if (/^anfiteatro/i.test(limpio)) return 'Anfit.';
  return limpio.length > 8 ? `${limpio.slice(0, 7)}…` : limpio;
}

// Determina si el texto sobre un fondo dado debe ser claro u oscuro
// usando luminancia perceptual (relativa a la fórmula sRGB).
function textoSobreFondo(hex?: string): 'light' | 'dark' {
  if (!hex) return 'light';
  const limpio = hex.replace('#', '');
  if (limpio.length !== 6) return 'light';
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? 'dark' : 'light';
}

// Resultado del cálculo: posición y dimensiones de una reserva en la grilla
interface ReservaConPosicionCompleta {
  reserva: Reserva;
  topPercent: number;
  alturaPercent: number;
  minutosInicio: number;
  minutosFin: number;
  leftPercent: number;
  widthPercent: number;
  indiceColumna: number;
  columnasGrupo: number;
}

// Asigna posición horizontal a una reserva dentro de su grupo de superposición.
// Usa "interval scheduling" greedy: asigna cada reserva a la primera "pista" cuya
// última reserva ya terminó. Esto permite reutilizar columnas y minimiza el ancho
// que necesita cada reserva (no se queda atrapada con el ancho del peor caso del grupo).
function calcularPosicionHorizontal<T extends RangoMinutos & { reserva: Reserva }>(
  reservaActual: T,
  grupos: T[][],
): T & { leftPercent: number; widthPercent: number; indiceColumna: number; columnasGrupo: number } {
  const grupo = grupos.find(g => g.some(r => r.reserva.id === reservaActual.reserva.id));
  if (!grupo) {
    return { ...reservaActual, leftPercent: 0, widthPercent: 100, indiceColumna: 0, columnasGrupo: 1 };
  }
  const ordenado = [...grupo].sort((a, b) => a.minutosInicio - b.minutosInicio);
  // Pistas: cada pista guarda el `minutosFin` de la última reserva colocada ahí.
  const pistas: number[] = [];
  const indicePorReservaId = new Map<number, number>();
  for (const r of ordenado) {
    const id = r.reserva.id;
    let asignada = pistas.findIndex(fin => fin <= r.minutosInicio);
    if (asignada === -1) {
      pistas.push(r.minutosFin);
      asignada = pistas.length - 1;
    } else {
      pistas[asignada] = r.minutosFin;
    }
    indicePorReservaId.set(id, asignada);
  }
  const columnasGrupo = pistas.length;
  const indiceColumna = indicePorReservaId.get(reservaActual.reserva.id) ?? 0;
  const widthPercent = 100 / columnasGrupo;
  const leftPercent = widthPercent * indiceColumna;
  return { ...reservaActual, leftPercent, widthPercent, indiceColumna, columnasGrupo };
}

// Tope de columnas visibles por día en la vista semanal. Cuando un día tiene más grupos
// superpuestos que esto, los excedentes se colapsan en un chip "+N" que abre un popover.
const MAX_COLUMNAS_VISIBLES_SEMANA = 6;

interface OverflowChipBucket {
  inicio: Date;
  fin: Date;
  reservas: Reserva[];
}

// Mergea los grupos que cayeron fuera del tope de columnas en "cubos" de overflow:
// dos grupos que se superponen en el tiempo se funden en un único chip que abarca
// la unión de sus rangos. Así evitamos apilar varios chips en la misma franja horaria.
function construirOverflowBuckets(grupos: GrupoReservasConPosicion[]): OverflowChipBucket[] {
  if (grupos.length === 0) return [];
  const ordenados = [...grupos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const cubos: OverflowChipBucket[] = [];
  for (const g of ordenados) {
    const ultimo = cubos[cubos.length - 1];
    if (ultimo && g.inicio.getTime() < ultimo.fin.getTime()) {
      ultimo.fin = new Date(Math.max(ultimo.fin.getTime(), g.fin.getTime()));
      ultimo.reservas.push(...g.reservas);
    } else {
      cubos.push({ inicio: g.inicio, fin: new Date(g.fin), reservas: [...g.reservas] });
    }
  }
  return cubos;
}

// Lista compartida para popovers: muestra reservas como botones con swatch, nombre y horario.
// La usan tanto el chip de overflow como las barras agrupadas (×N).
function ListaReservasPopoverContent({
  titulo,
  reservas,
  onViewDetails,
}: Readonly<{ titulo: string; reservas: Reserva[]; onViewDetails: (r: Reserva) => void }>) {
  return (
    <>
      <div className="text-xs font-semibold text-foreground mb-1.5 px-1">{titulo}</div>
      <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
        {reservas
          .slice()
          .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
          .map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => onViewDetails(r)}
              className="flex items-center gap-2 text-left text-xs rounded-sm px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0 border border-black/10"
                style={{ backgroundColor: r.tipoEspacioColor ?? '#9ca3af' }}
                aria-hidden="true"
              />
              <span className="flex-1 min-w-0 truncate">{r.espacioNombre}</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {formatTime(r.inicio)}–{formatTime(r.fin)}
              </span>
            </button>
          ))}
      </div>
    </>
  );
}

interface OverflowChipProps {
  top: number;
  leftPercent: number;
  widthPercent: number;
  altura: number;
  reservas: Reserva[];
  onViewDetails: (reserva: Reserva) => void;
  zIndex: number;
}

function OverflowChip({ top, leftPercent, widthPercent, altura, reservas, onViewDetails, zIndex }: Readonly<OverflowChipProps>) {
  const cuenta = reservas.length;
  const apilado = widthPercent < 16;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute cursor-pointer bg-chrome hover:bg-chrome text-white border border-border rounded-sm overflow-hidden transition-colors p-0"
          style={{
            top: `${top + 1}px`,
            left: `calc(${leftPercent}% + 3px)`,
            width: `calc(${widthPercent}% - 6px)`,
            height: `${Math.max(2, altura - 2)}px`,
            zIndex,
          }}
          aria-label={`${cuenta} reservas adicionales — abrir lista`}
        >
          {apilado ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center text-2xs font-bold leading-none">
              <span>+</span>
              <span>{cuenta}</span>
            </span>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-2xs font-bold leading-none">
              +{cuenta}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <ListaReservasPopoverContent
          titulo={`${cuenta} reservas adicionales`}
          reservas={reservas}
          onViewDetails={onViewDetails}
        />
      </PopoverContent>
    </Popover>
  );
}

// Renderiza una leyenda de los tipos de espacio que aparecen en las reservas visibles,
// con un swatch del color asignado a ese tipo (mismo que se usa en las barras del calendario).
function renderLeyendaTipos(reservas: Reserva[]): ReactNode {
  const mapa = new Map<string, { nombre: string; color?: string }>();
  reservas.forEach(r => {
    const nombre = r.tipoEspacioNombre;
    if (!nombre) return;
    if (!mapa.has(nombre)) {
      mapa.set(nombre, { nombre, color: r.tipoEspacioColor });
    }
  });
  if (mapa.size === 0) return null;
  const items = Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Tipos:</span>
      {items.map(item => (
        <span key={item.nombre} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
            style={{ backgroundColor: item.color ?? '#9ca3af' }}
            aria-hidden="true"
          />
          {item.nombre}
        </span>
      ))}
    </div>
  );
}

// Renderiza el resumen de cantidad de reservas en la semana
function renderResumenSemana(days: Date[], getReservasForDate: (d: Date) => Reserva[]): ReactNode {
  const totalReservas = days.reduce((total, day) => total + getReservasForDate(day).length, 0);
  if (totalReservas === 0) return null;
  const sufijo = totalReservas === 1 ? '' : 's';
  return (
    <div className="text-xs text-muted-foreground">
      {totalReservas} reserva{sufijo} programada{sufijo} para esta semana
    </div>
  );
}

// Calcula posiciones (vertical y horizontal) para reservas que pueden superponerse
function calcularPosicionesConSuperposicion(
  reservasOrdenadas: Reserva[],
  rangoCfg: RangoVisibleConfig,
): ReservaConPosicionCompleta[] {
  const reservasConPosicion = reservasOrdenadas.map(reserva => {
    const posicion = calcularPosicionVerticalReserva(reserva, rangoCfg);
    return posicion ? { reserva, ...posicion } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const grupos: Array<Array<typeof reservasConPosicion[0]>> = [];
  reservasConPosicion.forEach(reservaActual => {
    insertarReservaEnGrupos(grupos, reservaActual);
  });

  return reservasConPosicion.map(reservaActual => calcularPosicionHorizontal(reservaActual, grupos));
}

interface ReservationBarProps {
  top: number;
  leftPercent: number;
  widthPercent: number;
  altura: number;
  colorConfig: { bg: string; border: string; hoverBg: string; hoverBorder: string };
  /** Color hex opcional (del tipo de espacio). Si se pasa, sobrescribe las clases bg/border. */
  bgColorOverride?: string;
  tituloTooltip: string;
  /** Texto descriptivo (no se pinta, solo para debugging / accesibilidad extra). */
  label?: string;
  /** Cantidad de reservas que se agrupan en esta barra (>1 muestra contador "×N"). */
  cantidadAgrupada?: number;
  zIndex: number;
  /** Reserva principal (representante del grupo cuando hay agrupación). */
  reserva: Reserva;
  /** Conjunto completo de reservas del grupo. Cuando hay >1 se muestra popover con la lista. */
  reservasGrupo?: Reserva[];
  onViewDetails: (reserva: Reserva) => void;
}

function ReservationBar({
  top,
  leftPercent,
  widthPercent,
  altura,
  colorConfig,
  bgColorOverride,
  tituloTooltip,
  label,
  zIndex,
  reserva,
  reservasGrupo,
  onViewDetails,
  cantidadAgrupada,
}: Readonly<ReservationBarProps>) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const esAgrupada = (cantidadAgrupada ?? 0) > 1 && (reservasGrupo?.length ?? 0) > 1;
  const handleClick = useCallback(() => {
    // Para barras agrupadas el click lo maneja el PopoverTrigger; el detalle se abre
    // recién cuando el usuario elige una reserva de la lista.
    if (!esAgrupada) onViewDetails(reserva);
  }, [onViewDetails, reserva, esAgrupada]);

  const usarColorTipo = !!bgColorOverride;
  const colorTextoClase = usarColorTipo
    ? (textoSobreFondo(bgColorOverride) === 'dark' ? 'text-foreground' : 'text-white')
    : 'text-white';
  // Indicador de agrupación: solo si la barra es lo suficientemente alta como para
  // que el contador no encime visualmente al cuerpo de la barra.
  const mostrarContador = (cantidadAgrupada ?? 0) > 1 && altura >= 16;
  // Si la barra es muy angosta, el "×N" no entra en una sola línea horizontal:
  // lo apilamos en dos renglones ("×" arriba, número abajo) para que siga siendo legible.
  const contadorDosDigitos = (cantidadAgrupada ?? 0) >= 10;
  const contadorApilado = mostrarContador && (widthPercent < 16 || (contadorDosDigitos && widthPercent < 20));

  const botonBarra = (
    <button
      type="button"
      className="absolute cursor-pointer group p-0 bg-transparent border-0 text-left"
      style={{
        // Pequeño margen vertical para que dos reservas consecutivas en el tiempo
        // no queden pegadas (mismo color → se leían como una sola barra).
        top: `${top + 1}px`,
        left: `calc(${leftPercent}% + 3px)`,
        width: `calc(${widthPercent}% - 6px)`,
        height: `${Math.max(2, altura - 2)}px`,
        zIndex: zIndex,
      }}
      onClick={handleClick}
      aria-label={tituloTooltip}
      data-label={label}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setMousePosition(null);
      }}
      onMouseMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
    >
      <div
        className={
          usarColorTipo
            ? 'h-full border rounded-sm overflow-hidden relative hover:brightness-110 transition-[filter]'
            : `h-full border rounded-sm overflow-hidden relative transition-colors ${colorConfig.bg} ${colorConfig.border} ${colorConfig.hoverBg} ${colorConfig.hoverBorder}`
        }
        style={{
          minHeight: '2px',
          ...(usarColorTipo
            ? { backgroundColor: bgColorOverride, borderColor: bgColorOverride }
            : {}),
        }}
      >
        {mostrarContador && (
          contadorApilado ? (
            <span
              className={`absolute inset-0 flex flex-col items-center justify-center text-2xs font-bold leading-none pointer-events-none ${colorTextoClase}`}
            >
              <span>×</span>
              <span>{cantidadAgrupada}</span>
            </span>
          ) : (
            <span
              className={`absolute inset-0 flex items-center justify-center text-2xs font-bold leading-none pointer-events-none ${colorTextoClase}`}
            >
              ×{cantidadAgrupada}
            </span>
          )
        )}
      </div>
      {/* Tooltip que sigue el cursor - renderizado en portal para quedar por encima del resto */}
      {showTooltip && mousePosition && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none z-[99999] bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
          }}
        >
          {tituloTooltip}
        </div>,
        document.body
      )}
    </button>
  );

  if (esAgrupada && reservasGrupo) {
    return (
      <Popover>
        <PopoverTrigger asChild>{botonBarra}</PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <ListaReservasPopoverContent
            titulo={`${cantidadAgrupada} reservas en este horario`}
            reservas={reservasGrupo}
            onViewDetails={onViewDetails}
          />
        </PopoverContent>
      </Popover>
    );
  }
  return botonBarra;
}

// Lee la vista actual del calendario respetando preferencias del usuario.
function useCalendarViewMode(prefersWeekDefault: boolean) {
  const { preferencias } = usePreferences();
  const preferenciaCalendarViewMode = preferencias?.reservasCalendarViewMode as CalendarViewMode | undefined;
  const defaultMode: CalendarViewMode = prefersWeekDefault ? 'week' : 'month';
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>(
    preferenciaCalendarViewMode ?? defaultMode,
  );
  useEffect(() => {
    if (preferencias?.reservasCalendarViewMode) {
      setCalendarViewMode(preferencias.reservasCalendarViewMode as CalendarViewMode);
    }
  }, [preferencias]);
  return { calendarViewMode, setCalendarViewMode };
}

// Maneja modo pantalla completa local + scroll-lock del documento.
function useFullScreen(isFullScreenProp?: boolean, onToggleFullScreenProp?: () => void) {
  const [isFullScreenInternal, setIsFullScreenInternal] = useState(false);
  const isFullScreen = isFullScreenProp ?? isFullScreenInternal;
  const handleToggleFullScreen = onToggleFullScreenProp ?? (() => setIsFullScreenInternal(prev => !prev));
  useEffect(() => {
    const overflowValue = isFullScreen ? 'hidden' : '';
    document.body.style.overflow = overflowValue;
    document.documentElement.style.overflow = overflowValue;
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullScreen]);
  return { isFullScreen, handleToggleFullScreen };
}

interface ReservationCalendarViewProps {
  reservas: Reserva[];
  espaciosUnicos: Espacio[];
  carrerasUnicas?: Carrera[];
  tiposEspacioUnicos?: TipoEspacio[];
  // Filtros
  tiempoFilter: string;
  estadoFilter: string;
  espacioFilter: number | null;
  carreraFilter?: number | null;
  tipoEspacioFilter?: number | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  viewMode: 'cards' | 'table' | 'calendar';
  hayFiltrosActivos: boolean;
  showPendienteFilter?: boolean;
  hideEstadoFilter?: boolean; // Ocultar completamente el filtro de estado
  onTiempoFilterChange: (filter: string) => void;
  onEstadoFilterChange: (filter: string) => void;
  onEspacioFilterChange: (filter: number | null) => void;
  onCarreraFilterChange?: (filter: number | null) => void;
  onTipoEspacioFilterChange?: (filter: number | null) => void;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onViewModeChange: (mode: 'cards' | 'table' | 'calendar') => void;
  onClearFilters: () => void;
  // Acciones
  onViewDetails: (reserva: Reserva) => void;
  onCancelReserva: (reserva: Reserva) => void;
  // Pantalla completa
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  // Loading
  loading?: boolean;
  // Modo solo lectura (oculta acciones de gestión)
  readOnly?: boolean;
  /**
   * Notifica al parent cuándo cambia el rango visible (al navegar día/semana/mes).
   * Sirve para que el parent reacople el fetch a la ventana que se está viendo.
   */
  onVisibleRangeChange?: (start: Date, end: Date) => void;
}

export default function ReservationCalendarView({
  reservas,
  espaciosUnicos,
  carrerasUnicas = [],
  tiposEspacioUnicos = [],
  tiempoFilter,
  estadoFilter,
  espacioFilter,
  carreraFilter,
  tipoEspacioFilter,
  fechaInicio,
  fechaFin,
  viewMode,
  hayFiltrosActivos,
  showPendienteFilter = false,
  hideEstadoFilter = false,
  onTiempoFilterChange,
  onEstadoFilterChange,
  onEspacioFilterChange,
  onCarreraFilterChange,
  onTipoEspacioFilterChange,
  onFechaInicioChange,
  onFechaFinChange,
  onViewModeChange,
  onClearFilters,
  onViewDetails,
    isFullScreen: isFullScreenProp,
  onToggleFullScreen: onToggleFullScreenProp,
  loading = false,
  readOnly = false,
  onVisibleRangeChange,
}: Readonly<ReservationCalendarViewProps>) {
  const { hasPermission } = useRolePermissions();
  const canApprove = hasPermission('reserva:aprobar');
  const canViewRecommendations = hasPermission('recomendacion:ver');

  const { calendarViewMode, setCalendarViewMode } = useCalendarViewMode(canApprove || canViewRecommendations);
  const { isFullScreen, handleToggleFullScreen } = useFullScreen(isFullScreenProp, onToggleFullScreenProp);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hideNightHours, setHideNightHours] = useState(true);

  // Notificar al parent cuándo cambia el rango visible. Esto permite acotar el
  // fetch a la ventana que el usuario está viendo (sin esto, navegar al mes
  // siguiente no traería las reservas que caen fuera del default ±60 días).
  // No incluimos `onVisibleRangeChange` en las deps porque se recrea en cada
  // render del parent y dispararía un loop infinito de re-fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!onVisibleRangeChange) return;
    let start: Date;
    let end: Date;
    if (calendarViewMode === 'day') {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (calendarViewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }
    onVisibleRangeChange(start, end);
  }, [currentDate, calendarViewMode]);

  // Obtener reservas para una fecha específica
  const getReservasForDate = (date: Date): Reserva[] => {
    return reservas.filter(reserva => {
      const fechaReserva = new Date(reserva.inicio);
      return isSameDay(fechaReserva, date);
    });
  };

  // Obtener reservas para un rango de fechas
  const getReservasForRange = (start: Date, end: Date): Reserva[] => {
    return reservas.filter(reserva => {
      const fechaReserva = new Date(reserva.inicio);
      return fechaReserva >= start && fechaReserva <= end;
    });
  };

  // Navegación: tablas de transición por modo de vista
  const previousByMode: Record<CalendarViewMode, (d: Date) => Date> = {
    day: (d) => subDays(d, 1),
    week: (d) => subWeeks(d, 1),
    month: (d) => subMonths(d, 1),
  };
  const nextByMode: Record<CalendarViewMode, (d: Date) => Date> = {
    day: (d) => addDays(d, 1),
    week: (d) => addWeeks(d, 1),
    month: (d) => addMonths(d, 1),
  };

  const handlePrevious = () => setCurrentDate(previousByMode[calendarViewMode](currentDate));
  const handleNext = () => setCurrentDate(nextByMode[calendarViewMode](currentDate));

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Renderizar vista de día con timeline de intervalos de 15 minutos
  const renderDayView = () => {
    const reservasDia = getReservasForDate(currentDate);
    
    // Ordenar reservas por hora de inicio
    const reservasOrdenadas = [...reservasDia].sort((a, b) => 
      new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    );

    // Mostrar un rango consistente de horas sin secciones colapsadas
    const horaInicioVisible = hideNightHours ? 8 : 0;
    const horaFinVisible = 24;
    const mostrarColapsadoAntes = false;
    const mostrarColapsadoDespues = false;

    const minutosInicioVisible = horaInicioVisible * 60;
    const minutosFinVisible = horaFinVisible * 60;
    const minutosTotalesVisibles = minutosFinVisible - minutosInicioVisible;
    const alturaPorHora = 120; // 120px por hora
    const alturaAreaVisible = (minutosTotalesVisibles / 60) * alturaPorHora;
    const alturaMinima = alturaAreaVisible + (mostrarColapsadoAntes ? 48 : 0) + (mostrarColapsadoDespues ? 48 : 0);

    const rangoCfg: RangoVisibleConfig = {
      minutosInicioVisible,
      minutosFinVisible,
      minutosTotalesVisibles,
    };

    // Detectar reservas superpuestas y calcular posiciones horizontales
    const posicionesConSuperposicion = calcularPosicionesConSuperposicion(reservasOrdenadas, rangoCfg);

    // Crear intervalos de 15 minutos solo para el rango visible
    const intervalos = Array.from({ length: (minutosTotalesVisibles / 15) }, (_, i) => {
      const minutosTotales = minutosInicioVisible + (i * 15);
      const hora = Math.floor(minutosTotales / 60);
      const minutos = minutosTotales % 60;
      return { hora, minutos, minutosTotales };
    });

           return (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-card">
             <div className="flex">
               {/* Columna de horas - fija a la izquierda */}
               <div className={`w-28 flex-shrink-0 border-r bg-muted/50 relative`} style={{ minHeight: `${alturaMinima}px` }}>
                 {/* Sección colapsada antes */}
                 {mostrarColapsadoAntes && (
                   <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-end pr-3 border-b border-border">
                     <span className="text-xs text-muted-foreground">...</span>
                   </div>
                 )}
                 
                 {/* Intervalos visibles */}
                 {intervalos.map((intervalo) => {
                   const minutosDesdeInicioVisible = intervalo.minutosTotales - minutosInicioVisible;
                   const porcentajeTop = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                   const esHoraCompleta = intervalo.minutos === 0;
                   const esMediaHora = intervalo.minutos === 30;
                   
                   // Calcular altura del área visible (sin secciones colapsadas)
                   const alturaAreaVisible = alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0);
                   const topPx = (mostrarColapsadoAntes ? 48 : 0) + (porcentajeTop * alturaAreaVisible / 100);
                   const alturaIntervalo = alturaAreaVisible / intervalos.length;
                   
                   const getBorderClass = () => getIntervalBorderClass(esHoraCompleta, esMediaHora);
                   const getTextSizeClass = () => {
                     if (esHoraCompleta) return 'text-base';
                     if (esMediaHora) return 'text-sm';
                     return 'text-xs opacity-75';
                   };
                   return (
                     <div
                       key={`${intervalo.hora}-${intervalo.minutos}`}
                       className={`absolute flex items-center justify-end pr-3 w-full ${getBorderClass()}`}
                       style={{
                         top: `${topPx}px`,
                         height: `${alturaIntervalo}px`
                       }}
                     >
                       <span className={`font-medium text-muted-foreground ${getTextSizeClass()}`}>
                         {intervalo.hora.toString().padStart(2, '0')}:{intervalo.minutos.toString().padStart(2, '0')}
                       </span>
                     </div>
                   );
                 })}
                 
                 {/* Sección colapsada después */}
                 {mostrarColapsadoDespues && (
                   <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-end pr-3 border-t border-border">
                     <span className="text-xs text-muted-foreground">...</span>
                   </div>
                 )}
               </div>

                               {/* Área de timeline - scrollable */}
                <div className={`flex-1 relative bg-card ${isFullScreen ? '' : 'overflow-y-auto'}`} style={{ minHeight: `${alturaMinima}px`, backgroundColor: 'var(--background)' }}>
                  {/* Sección colapsada antes */}
                  {mostrarColapsadoAntes && (
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center border-b border-border bg-muted/30">
                      <span className="text-xs text-muted-foreground">...</span>
                    </div>
                  )}
                  
                  {/* Líneas de fondo - coinciden con intervalos de 15 minutos */}
                  <div className="absolute w-full" style={{ 
                    top: mostrarColapsadoAntes ? '48px' : '0',
                    bottom: mostrarColapsadoDespues ? '48px' : '0',
                    left: 0,
                    right: 0
                  }}>
                    {intervalos.map((intervalo) => {
                      const minutosDesdeInicioVisible = intervalo.minutosTotales - minutosInicioVisible;
                      const porcentajeTop = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                      const esHoraCompleta = intervalo.minutos === 0;
                      const esMediaHora = intervalo.minutos === 30;
                      
                      const getLineBorderClass = () => getIntervalBorderClass(esHoraCompleta, esMediaHora);
                      return (
                        <div
                          key={`line-${intervalo.hora}-${intervalo.minutos}`}
                          className={`absolute w-full ${getLineBorderClass()}`}
                          style={{ top: `${porcentajeTop}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Reservas como barras */}
                  <div className="absolute px-1 py-0.5" style={{ 
                    top: mostrarColapsadoAntes ? '48px' : '0',
                    bottom: mostrarColapsadoDespues ? '48px' : '0',
                    left: 0,
                    right: 0,
                    backgroundColor: 'transparent',
                  }}>
                    {posicionesConSuperposicion.map((item, index) => {
                      const { reserva, topPercent, alturaPercent, leftPercent, widthPercent, indiceColumna } = item;
                      const esPasada = new Date(reserva.fin) < new Date();
                      const alturaAreaVisible = alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0);
                      const alturaPx = Math.max(alturaPercent * alturaAreaVisible / 100, 26);
                      // Cap del ancho para que cuando esté sola o solo se solape con pocas no
                      // ocupe toda la columna del día. Cuando aplica el cap, reubicamos también
                      // el left para que las tarjetas queden pegadas en vez de espaciadas.
                      const MAX_WIDTH_PERCENT = 30;
                      const aplicaCap = widthPercent > MAX_WIDTH_PERCENT;
                      const widthEfectivo = aplicaCap ? MAX_WIDTH_PERCENT : widthPercent;
                      const leftEfectivo = aplicaCap ? indiceColumna * MAX_WIDTH_PERCENT : leftPercent;
                      // Cuando la barra es angosta (mucha superposición) escondemos detalles
                      // secundarios para evitar que se rompan a varias líneas.
                      const mostrarCapacidad = widthEfectivo >= 20 && alturaPx >= 60;
                      const tipoColor = reserva.tipoEspacioColor ?? '#9ca3af';

                      return (
                        <button
                          type="button"
                          key={reserva.id}
                          onClick={() => onViewDetails(reserva)}
                          className="absolute rounded-md transition-all hover:shadow-md group text-left p-0 cursor-pointer"
                          style={{
                            top: `calc(${topPercent}% + 3px)`,
                            left: `calc(${leftEfectivo}% + 3px)`,
                            width: `calc(${widthEfectivo}% - 6px)`,
                            height: `${Math.max(2, alturaPx - 6)}px`,
                            backgroundColor: esPasada ? 'var(--muted)' : 'var(--card)',
                            borderLeft: `4px solid ${tipoColor}`,
                            border: `1px solid var(--border)`,
                            borderLeftWidth: '4px',
                            borderLeftColor: tipoColor,
                            opacity: esPasada ? 0.85 : 1,
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            zIndex: 10 + index,
                          }}
                          aria-label={`${reserva.titulo || reserva.espacioNombre} · ${formatTime(reserva.inicio)}-${formatTime(reserva.fin)}`}
                        >
                          <div className="h-full px-1.5 py-1 flex flex-col gap-0.5 overflow-hidden">
                            <h4
                              className={`text-xs font-semibold truncate leading-tight ${
                                esPasada ? 'text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {reserva.titulo || reserva.espacioNombre}
                            </h4>
                            <div className="flex items-center gap-1 text-2xs text-muted-foreground leading-tight">
                              <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                              <span className="truncate">
                                {formatTime(reserva.inicio)}–{formatTime(reserva.fin)}
                              </span>
                            </div>
                            {mostrarCapacidad && (
                              <div className="flex items-center gap-1 text-2xs text-muted-foreground leading-tight">
                                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">Cap. {reserva.capacidadEspacio}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Indicador de hora actual si es hoy */}
                  {isToday(currentDate) && (() => {
                    const ahora = new Date();
                    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
                    
                    // Si la hora actual está fuera del rango visible, no mostrar
                    if (minutosActuales < minutosInicioVisible || minutosActuales >= minutosFinVisible) {
                      return null;
                    }
                    
                    const minutosDesdeInicioVisible = minutosActuales - minutosInicioVisible;
                    const topPercent = (minutosDesdeInicioVisible / minutosTotalesVisibles) * 100;
                    
                    return (
                      <div
                        className="absolute left-0 right-0 z-50 pointer-events-none"
                        style={{ 
                          top: `${(mostrarColapsadoAntes ? 48 : 0) + (topPercent * (alturaMinima - (mostrarColapsadoAntes ? 48 : 0) - (mostrarColapsadoDespues ? 48 : 0)) / 100)}px`
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-danger -ml-1 -mt-1"></div>
                          <div className="flex-1 h-0.5 bg-danger"></div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Sección colapsada después */}
                  {mostrarColapsadoDespues && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center border-t border-border bg-muted/30">
                      <span className="text-xs text-muted-foreground">...</span>
                    </div>
                  )}
                </div>
          </div>
        </div>

        {/* Resumen de reservas del día */}
        {reservasOrdenadas.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {reservasOrdenadas.length} reserva{reservasOrdenadas.length === 1 ? '' : 's'} programada{reservasOrdenadas.length === 1 ? '' : 's'} para este día
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de semana
  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    // Calcular rango de horas para toda la semana
    let horaMinima = 24;
    let horaMaxima = 0;
    let hayReservas = false;

    days.forEach(day => {
      const reservasDia = getReservasForDate(day);
      reservasDia.forEach(reserva => {
        const inicio = new Date(reserva.inicio);
        const fin = new Date(reserva.fin);
        const horaInicio = inicio.getHours();
        const horaFin = fin.getHours() === 0 && fin.getMinutes() === 0 ? 24 : fin.getHours();
        
        if (horaInicio < horaMinima) horaMinima = horaInicio;
        if (horaFin > horaMaxima) horaMaxima = horaFin;
        hayReservas = true;
      });
    });

    // Rango visible: ajustar según hideNightHours y reservas
    let horaInicioVisible: number;
    let horaFinVisible: number;
    
    if (hideNightHours) {
      // Si hideNightHours está activo, empezar en 8am por defecto
      horaInicioVisible = 8;
      horaFinVisible = 24;
      
      // Si hay reservas antes de las 8am, mostrar desde más temprano
      if (hayReservas && horaMinima < 8) {
        horaInicioVisible = Math.max(0, horaMinima - 1);
      }
      // Si hay reservas después de las 22pm, expandir hasta más tarde
      if (hayReservas && horaMaxima >= 22) {
        horaFinVisible = Math.min(24, horaMaxima + 1);
      }
    } else {
      // Si hideNightHours está desactivado, mostrar desde 0am
      horaInicioVisible = hayReservas && horaMinima > 0 ? Math.max(0, horaMinima - 1) : 0;
      horaFinVisible = hayReservas && horaMaxima >= 22 ? Math.min(24, horaMaxima + 1) : 24;
    }
    
    const horasVisibles = horaFinVisible - horaInicioVisible;
    const alturaPorHora = isFullScreen ? 60 : 50;
    const alturaTotal = horasVisibles * alturaPorHora;

    // Generar todas las horas del día en el rango visible
    const horas = Array.from({ length: horasVisibles }, (_, i) => horaInicioVisible + i);

    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="grid grid-cols-8 gap-x-2 border-b bg-muted">
            {/* Celda vacía para el header de horas */}
            <div className="p-2 border-r"></div>
            {/* Headers de días */}
            {days.map((day) => {
              const esHoy = isToday(day);
              return (
                <div
                  key={`header-${day.toISOString()}`}
                  className={`p-2 text-center border-r last:border-r-0 ${esHoy ? 'bg-info-suave' : ''}`}
                >
                  <div className={`text-xs font-semibold ${esHoy ? 'text-info-texto' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-xs ${esHoy ? 'text-info-texto font-medium' : 'text-muted-foreground'}`}>
                    {format(day, 'd', { locale: es })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contenido - sin scroll, se extiende */}
          <div className="overflow-visible">
            <div className="grid grid-cols-8 gap-x-2">
              {/* Columna de horas */}
              <div className="border-r bg-muted/50">
                {horas.map((hora) => (
                  <div
                    key={hora}
                    className="border-b border-border px-2 py-1 text-xs text-muted-foreground text-right"
                    style={{ minHeight: `${alturaPorHora}px` }}
                  >
                    {hora.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

                                                         {/* Columnas de días */}
              {days.map((day) => {
                const reservasDia = getReservasForDate(day);
                const esHoy = isToday(day);

                const reservasConPosiciones = calcularPosicionesReservasPorDia(reservasDia);
                // Cantidad máxima de columnas necesarias en este día (para repartir el ancho
                // disponible entre las barras que se superponen sin recurrir a un ancho fijo).
                const maxColumnasDia = reservasConPosiciones.reduce(
                  (max, g) => Math.max(max, (g.columna ?? 0) + 1),
                  1,
                );
                // Si el día supera el tope, reservamos la última columna para un chip "+N"
                // que colapsa todo lo que no entra. El resto se renderiza normal.
                const hayOverflow = maxColumnasDia > MAX_COLUMNAS_VISIBLES_SEMANA;
                const columnasEfectivas = hayOverflow ? MAX_COLUMNAS_VISIBLES_SEMANA : maxColumnasDia;
                const columnaUmbralOverflow = hayOverflow ? MAX_COLUMNAS_VISIBLES_SEMANA - 1 : Infinity;
                const gruposVisibles = reservasConPosiciones.filter(g => g.columna < columnaUmbralOverflow);
                const gruposOverflow = hayOverflow
                  ? reservasConPosiciones.filter(g => g.columna >= columnaUmbralOverflow)
                  : [];
                const overflowBuckets = construirOverflowBuckets(gruposOverflow);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r last:border-r-0 relative ${esHoy ? 'bg-info-suave/30' : 'bg-card'}`}
                    style={{ minHeight: `${alturaTotal}px` }}
                  >
                    {/* Líneas de horas */}
                    {horas.map((hora) => (
                      <div
                        key={`line-${day.toISOString()}-${hora}`}
                        className="absolute left-0 right-0 border-b border-border"
                        style={{ top: `${(hora - horaInicioVisible) * alturaPorHora}px` }}
                      />
                    ))}

                                                                                                                                                                       {/* Barras finas para cada grupo de reservas */}
                       {gruposVisibles.map((grupo, index) => {
                         const { reservas, inicio, fin, columna, estado } = grupo;
                         if (!reservas || reservas.length === 0) return null;
                         const cantidadReservas = reservas.length;
                         const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
                         const horaFin = fin.getHours() === 0 && fin.getMinutes() === 0 ? 24 : fin.getHours() + fin.getMinutes() / 60;

                        // Si está fuera del rango visible, no mostrarlo
                        if (horaFin <= horaInicioVisible || horaInicio >= horaFinVisible) {
                          return null;
                        }

                          const top = Math.max(0, (horaInicio - horaInicioVisible) * alturaPorHora);
                          const altura = Math.max(2, (horaFin - horaInicio) * alturaPorHora);

                          // Ancho proporcional: repartimos el ancho de la columna del día entre
                          // las barras que se superponen para que cada una sea legible.
                          const widthPercent = 100 / columnasEfectivas;
                          const leftPercent = columna * widthPercent;

                          // Usar el estado del grupo (ya está normalizado)
                          const estadoNormalizado = estado?.toUpperCase() || 'APROBADO';
                          const reservaPrincipal = reservas[0];

                          const colorConfig = getColorConfigByEstado(estadoNormalizado, columna);
                          // Si todas las reservas del grupo comparten tipo de espacio, usamos
                          // su color; de lo contrario caemos en la paleta por estado.
                          const tipoColorComun = reservas.every(r => r.tipoEspacioColor === reservaPrincipal.tipoEspacioColor)
                            ? reservaPrincipal.tipoEspacioColor
                            : undefined;
                          const horarioStr = `${formatTime(inicio.toISOString())} a ${formatTime(fin.toISOString())}`;
                          const tituloTooltip = cantidadReservas > 1
                            ? `${cantidadReservas} reservas de ${horarioStr}`
                            : `${reservaPrincipal.espacioNombre} — ${horarioStr}`;
                          const label = cantidadReservas > 1
                            ? `×${cantidadReservas}`
                            : abreviarNombreEspacio(reservaPrincipal.espacioNombre);

                          return (
                              <ReservationBar
                                key={`barra-${day.toISOString()}-${inicio.getTime()}-${fin.getTime()}-${index}`}
                                top={top}
                                leftPercent={leftPercent}
                                widthPercent={widthPercent}
                                altura={altura}
                                colorConfig={colorConfig}
                                bgColorOverride={tipoColorComun}
                                tituloTooltip={tituloTooltip}
                                label={label}
                                cantidadAgrupada={cantidadReservas}
                                reservasGrupo={reservas}
                                zIndex={10 + index}
                                reserva={reservaPrincipal}
                                onViewDetails={onViewDetails}
                              />
                          );
                      })}

                      {/* Chips de overflow: una entrada por rango horario que tiene más
                          reservas de las que entran en las columnas visibles. */}
                      {overflowBuckets.map((bucket, idx) => {
                        const horaInicio = bucket.inicio.getHours() + bucket.inicio.getMinutes() / 60;
                        const horaFin = bucket.fin.getHours() === 0 && bucket.fin.getMinutes() === 0
                          ? 24
                          : bucket.fin.getHours() + bucket.fin.getMinutes() / 60;
                        if (horaFin <= horaInicioVisible || horaInicio >= horaFinVisible) return null;
                        const top = Math.max(0, (horaInicio - horaInicioVisible) * alturaPorHora);
                        const altura = Math.max(2, (horaFin - horaInicio) * alturaPorHora);
                        const widthPercent = 100 / columnasEfectivas;
                        const leftPercent = columnaUmbralOverflow * widthPercent;
                        return (
                          <OverflowChip
                            key={`overflow-${day.toISOString()}-${bucket.inicio.getTime()}-${idx}`}
                            top={top}
                            leftPercent={leftPercent}
                            widthPercent={widthPercent}
                            altura={altura}
                            reservas={bucket.reservas}
                            onViewDetails={onViewDetails}
                            zIndex={20 + idx}
                          />
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leyenda de tipos de espacio presentes en la semana */}
        {renderLeyendaTipos(days.flatMap(d => getReservasForDate(d)))}

        {/* Resumen de la semana */}
        {renderResumenSemana(days, getReservasForDate)}
      </div>
    );
  };

  // Renderizar vista de mes
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    // Asegurar que empiece en lunes
    const firstDay = startOfWeek(start, { weekStartsOn: 1 });
    const lastDay = endOfWeek(end, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });

    const reservasMes = getReservasForRange(start, end);
    const reservasPorDia = new Map<string, Reserva[]>();

    reservasMes.forEach(reserva => {
      // Filtrar pendientes para analistas/admin (no deben aparecer en la vista principal)
      if (reserva.estado === 'PENDIENTE' && !showPendienteFilter) {
        return;
      }
      const fechaReserva = new Date(reserva.inicio);
      const key = format(fechaReserva, 'yyyy-MM-dd');
      if (!reservasPorDia.has(key)) {
        reservasPorDia.set(key, []);
      }
      reservasPorDia.get(key)!.push(reserva);
    });

    // Máximo de reservas en cualquier día del mes — sirve para escalar el heatmap.
    const maxReservasDia = Math.max(
      1,
      ...Array.from(reservasPorDia.values()).map(rs => rs.length),
    );

    // Heatmap en escala azul, alineada con el resto de las vistas del calendario.
    const getHeatmapBgClass = (densidad: number): string => {
      if (densidad === 0) return '';
      if (densidad < 0.2) return 'bg-info-suave';
      if (densidad < 0.4) return 'bg-info-suave';
      if (densidad < 0.6) return 'bg-info-suave';
      if (densidad < 0.8) return 'bg-info';
      return 'bg-info';
    };

    // Top tipos de espacio del día con su color y cantidad.
    const calcularTiposDelDia = (reservas: Reserva[]) => {
      const conteo = new Map<string, { nombre: string; color?: string; cantidad: number }>();
      reservas.forEach(r => {
        const nombre = r.tipoEspacioNombre ?? 'Otro';
        const existente = conteo.get(nombre);
        if (existente) {
          existente.cantidad += 1;
        } else {
          conteo.set(nombre, { nombre, color: r.tipoEspacioColor, cantidad: 1 });
        }
      });
      return Array.from(conteo.values()).sort((a, b) => b.cantidad - a.cantidad);
    };

    const ahora = new Date();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Encabezados de días */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center py-2">
              {day}
            </div>
          ))}

          {/* Días del calendario */}
          {allDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const reservasDia = reservasPorDia.get(key) || [];
            const cantidad = reservasDia.length;
            const esHoy = isToday(day);
            const esDelMes = isSameMonth(day, currentDate);
            const esPasado = day < ahora && !esHoy;

            const densidad = cantidad / maxReservasDia;
            const heatmapBg = getHeatmapBgClass(densidad);
            const tiposDelDia = calcularTiposDelDia(reservasDia).slice(0, 3);

            const containerClass = [
              'min-h-[100px] rounded-lg p-1.5 cursor-pointer transition-all hover:shadow-md text-left w-full flex flex-col gap-1.5 border',
              // Hoy: anillo azul exterior para que destaque incluso encima del heatmap.
              esHoy
                ? 'border-info ring-2 ring-info ring-offset-1'
                : esDelMes ? 'border-border' : 'border-border',
              !esDelMes ? 'opacity-50' : '',
              esPasado && esDelMes ? 'opacity-70' : '',
              heatmapBg || (esDelMes ? 'bg-card' : 'bg-muted'),
            ].filter(Boolean).join(' ');

            return (
              <button
                type="button"
                key={day.toISOString()}
                className={containerClass}
                onClick={() => {
                  setCurrentDate(day);
                  setCalendarViewMode('day');
                }}
                aria-label={`Día ${format(day, 'd')}${cantidad ? ` · ${cantidad} reservas` : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={
                      esHoy
                        ? 'inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-info text-white text-xs font-semibold'
                        : `text-xs font-medium ${esDelMes ? 'text-foreground' : 'text-muted-foreground'}`
                    }
                  >
                    {format(day, 'd')}
                  </span>
                  {cantidad > 0 && (
                    <span className="text-2xs text-muted-foreground font-medium tabular-nums">
                      {cantidad}
                    </span>
                  )}
                </div>

                {/* Puntos por tipo de espacio (top 3) — sin fondo, sólo dot + número. */}
                {tiposDelDia.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    {tiposDelDia.map(tipo => (
                      <span
                        key={tipo.nombre}
                        className="inline-flex items-center gap-1 text-2xs font-medium text-foreground/80"
                        title={`${tipo.cantidad} ${tipo.nombre}`}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: tipo.color ?? '#9ca3af' }}
                        />
                        {tipo.cantidad}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={isFullScreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : 'h-full flex flex-col'}>
      <Card className={isFullScreen ? 'min-h-full flex flex-col' : 'h-full flex flex-col'}>
        <CardHeader className="shrink-0 pb-3">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <ReservationFilters
                tiempoFilter={tiempoFilter}
                estadoFilter={estadoFilter}
                espacioFilter={espacioFilter}
                carreraFilter={carreraFilter ?? null}
                tipoEspacioFilter={tipoEspacioFilter ?? null}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                espaciosUnicos={espaciosUnicos}
                carrerasUnicas={carrerasUnicas}
                tiposEspacioUnicos={tiposEspacioUnicos}
                hayFiltrosActivos={hayFiltrosActivos}
                showPendienteFilter={showPendienteFilter}
                hideEstadoFilter={hideEstadoFilter}
                onTiempoFilterChange={onTiempoFilterChange}
                onEstadoFilterChange={onEstadoFilterChange}
                onEspacioFilterChange={onEspacioFilterChange}
                onCarreraFilterChange={onCarreraFilterChange ?? (() => {})}
                onTipoEspacioFilterChange={onTipoEspacioFilterChange ?? (() => {})}
                onFechaInicioChange={onFechaInicioChange}
                onFechaFinChange={onFechaFinChange}
                onClearFilters={onClearFilters}
              />
            </div>
            {!readOnly && (
              <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            )}
            {handleToggleFullScreen && (
              <FullScreenToggle isFullScreen={isFullScreen} onToggle={handleToggleFullScreen} />
            )}
          </div>
        </CardHeader>
      <CardContent className="pt-0 relative flex-1 flex flex-col min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        )}
        {/* Controles de navegación y vista.
            shrink-0 siempre, no sólo en pantalla completa: cuando los filtros
            de arriba ocupan dos renglones, el bloque se achicaba y la fecha
            quedaba debajo de los botones de navegación. */}
        <div className="mb-4 flex shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 px-3 text-xs"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Selector de modo de vista */}
            <div className="flex items-center gap-2">
              {/* Botón toggle para ocultar horas nocturnas - visible en vista día y semana */}
              {(calendarViewMode === 'day' || calendarViewMode === 'week') && (
                <div className="flex items-center border rounded-lg p-0.5 bg-muted">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setHideNightHours(!hideNightHours)}
                        className={`p-1.5 rounded transition-colors ${
                          hideNightHours
                            ? 'bg-card text-foreground shadow-md ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground/80'
                        }`}
                      >
                        <Moon className={`h-3.5 w-3.5 ${hideNightHours ? 'text-info-texto' : 'text-muted-foreground'}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hideNightHours ? 'Ocultar horas nocturnas (activo)' : 'Mostrar horas nocturnas'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              <div className="flex items-center border rounded-lg p-0.5 bg-muted">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('day')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'day' ? 'bg-card shadow-sm' : ''}`}
                >
                  Día
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('week')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'week' ? 'bg-card shadow-sm' : ''}`}
                >
                  Semana
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewMode('month')}
                  className={`h-7 px-2 text-xs ${calendarViewMode === 'month' ? 'bg-card shadow-sm' : ''}`}
                >
                  Mes
                </Button>
              </div>
            </div>
          </div>
          
          {/* Fecha - siempre abajo */}
          <div className="text-sm font-medium px-2">
            {calendarViewMode === 'day' && format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            {calendarViewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: es })}`}
            {calendarViewMode === 'month' && format(currentDate, "MMMM yyyy", { locale: es })}
          </div>
        </div>

        {/* Contenido según el modo */}
        <div>
          {calendarViewMode === 'day' && renderDayView()}
          {calendarViewMode === 'week' && renderWeekView()}
          {calendarViewMode === 'month' && renderMonthView()}
        </div>
      </CardContent>
      </Card>
    </div>
  );
}


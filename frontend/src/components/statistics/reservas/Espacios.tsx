import { AlertTriangle, CalendarDays, Presentation, Users } from 'lucide-react';
import type { EspaciosReservas, UsoCapacidad, UsoEspacio } from '@/lib/api/stats';
import { Burbujas } from '../graficos/Burbujas';
import { filtrable, HOVER_FILTRO } from '../graficos/filtrable';
import { MatrizCalor } from '../graficos/MatrizCalor';
import { useTemaGraficos } from '../graficos/tema';
import { fechaCorta } from '../periodo';
import { Vacio } from '../Vacio';
import { entero } from './formato';

const HORAS = Array.from({ length: 14 }, (_, i) => i + 8);

/** Tipo de espacio × hora: qué tan lleno está cada tipo a cada hora de semana. */
export function Saturacion({ celdas }: Readonly<{ celdas: EspaciosReservas['saturacion'] }>) {
  const tipos = [...new Set(celdas.map((c) => c.tipoEspacio))];
  const espaciosPorTipo = new Map(celdas.map((c) => [c.tipoEspacio, c.espacios]));
  const llenas = new Map<string, number>();
  for (const c of celdas) llenas.set(c.tipoEspacio, (llenas.get(c.tipoEspacio) ?? 0) + Number(c.horasLlenas));
  // Primero los tipos que más se llenan.
  tipos.sort((a, b) => (llenas.get(b) ?? 0) - (llenas.get(a) ?? 0));
  if (tipos.length === 0) return <Vacio />;
  return (
    <MatrizCalor
      filas={tipos}
      columnas={HORAS}
      etiquetaColumna={(h) => `${h}`}
      etiquetaMarca="horas en que no quedó ninguno libre (tipos con más de un espacio)"
      notaFila={(t) => {
        const e = espaciosPorTipo.get(t) ?? 0;
        const l = llenas.get(t) ?? 0;
        return `${e} ${e === 1 ? 'espacio' : 'espacios'}${l > 0 && e > 1 ? ` · ${l} h llenas` : ''}`;
      }}
      celdas={celdas.map((c) => ({
        fila: c.tipoEspacio,
        columna: c.hora,
        valor: Number(c.ocupacionPct),
        // Con un solo espacio, cualquier reserva lo "llena": la marca no dice nada.
        marca: Number(c.espacios) > 1 ? Number(c.horasLlenas) : 0,
        detalle: `${c.espacios} espacios`,
      }))}
    />
  );
}

/** Rango del eje con margen y cortes redondos (de 5 en 5 o de 10 en 10). */
function dominioRedondo(valores: number[]): { dominio: [number, number]; ticks: number[] } {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const margen = Math.max(3, (max - min) * 0.3);
  const paso = max - min + 2 * margen > 40 ? 10 : 5;
  const desde = Math.max(0, Math.floor((min - margen) / paso) * paso);
  const hasta = Math.min(100, Math.ceil((max + margen) / paso) * paso);
  const ticks: number[] = [];
  for (let t = desde; t <= hasta; t += paso) ticks.push(t);
  return { dominio: [desde, hasta], ticks };
}

/**
 * Cada espacio según su capacidad y cuánto se ocupa. Arriba a la izquierda,
 * espacios chicos muy pedidos; abajo a la derecha, espacios grandes vacíos.
 * El eje vertical se ajusta a los datos: con todos entre 33% y 37%, de 0 a
 * 100 quedaban apilados en una línea.
 */
export function CapacidadOcupacion({ espacios, alto = 300, onFiltrar }: Readonly<{ espacios: UsoEspacio[]; alto?: number; onFiltrar?: (espacioId: number) => void }>) {
  const conCapacidad = espacios.filter((e) => e.capacidad != null && Number(e.capacidad) > 0);
  const sinCapacidad = espacios.length - conCapacidad.length;
  if (conCapacidad.length === 0) return <Vacio texto="Ningún espacio filtrado tiene capacidad cargada." />;

  const ocupaciones = conCapacidad.map((e) => Number(e.ocupacionPct));
  const capacidades = conCapacidad.map((e) => Number(e.capacidad));
  const promedio = ocupaciones.reduce((a, v) => a + v, 0) / ocupaciones.length;
  const { dominio, ticks } = dominioRedondo(ocupaciones);
  const minOc = Math.min(...ocupaciones);
  const maxOc = Math.max(...ocupaciones);
  const logX = Math.max(...capacidades) / Math.min(...capacidades) >= 8;

  // Nombre escrito en las que se distinguen: la más y la menos ocupada, y las
  // de una capacidad que no comparte nadie. Las demás, al pasar el mouse.
  const cuantasPorCapacidad = new Map<number, number>();
  for (const c of capacidades) cuantasPorCapacidad.set(c, (cuantasPorCapacidad.get(c) ?? 0) + 1);
  // Aislada: nadie más tiene una capacidad parecida (dentro de ×1,4), así que el nombre no pisa a otro.
  const aislada = (c: number) =>
    cuantasPorCapacidad.get(c) === 1 && capacidades.every((o) => o === c || Math.max(o, c) / Math.min(o, c) > 1.4);
  const masOcupado = conCapacidad.find((e) => Number(e.ocupacionPct) === maxOc);
  const menosOcupado = conCapacidad.find((e) => Number(e.ocupacionPct) === minOc);

  return (
    <div>
      <Burbujas
        alto={alto}
        ejeX={logX ? 'Capacidad (personas, escala log)' : 'Capacidad (personas)'}
        ejeY="Ocupación"
        tamano="Reservas"
        formatoY={(v) => `${Math.round(v)}%`}
        referenciaY={promedio}
        dominioY={dominio}
        ticksY={ticks}
        logX={logX}
        ticksX={logX ? [2, 5, 10, 20, 30, 50, 100, 200, 500, 1000].filter((t) => t >= Math.min(...capacidades) * 0.8 && t <= Math.max(...capacidades) * 1.25) : undefined}
        puntos={conCapacidad.map((e) => ({
          nombre: `${e.nombre}${e.tipoEspacio ? ` · ${e.tipoEspacio}` : ''}`,
          x: Number(e.capacidad),
          y: Number(e.ocupacionPct),
          z: Math.max(1, Number(e.reservas)),
          etiqueta: e === masOcupado || e === menosOcupado || aislada(Number(e.capacidad)) ? e.nombre : undefined,
          etiquetaAbajo: e === menosOcupado,
          alClic: onFiltrar ? () => onFiltrar(e.espacioId) : undefined,
        }))}
      />
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {maxOc - minOc < 6 && conCapacidad.length > 2 && (
          <p>
            La ocupación es pareja: todos entre <b className="text-foreground">{Math.round(minOc)}%</b> y <b className="text-foreground">{Math.round(maxOc)}%</b>. Lo que cambia es el tamaño del espacio.
          </p>
        )}
        {sinCapacidad > 0 && (
          <p>
            {sinCapacidad} {sinCapacidad === 1 ? 'espacio no tiene' : 'espacios no tienen'} capacidad cargada y no {sinCapacidad === 1 ? 'aparece' : 'aparecen'}.
          </p>
        )}
      </div>
    </div>
  );
}

function estado(c: UsoCapacidad): 'excedido' | 'sobredimensionado' | 'ok' {
  const capacidad = Number(c.capacidad ?? 0);
  if (capacidad > 0 && (Number(c.inscriptos) > capacidad || Number(c.cupo ?? 0) > capacidad)) return 'excedido';
  if (c.usoPct != null && Number(c.usoPct) < 25) return 'sobredimensionado';
  return 'ok';
}

/**
 * Tutorías y eventos contra la capacidad del espacio. Una barra por
 * actividad donde el 100% es lo que entra en el espacio: el relleno son los
 * inscriptos y la marca el cupo que se ofreció.
 */
export function UsoDeCapacidad({ filas, limite, espacios, onFiltrar }: Readonly<{ filas: UsoCapacidad[]; limite?: number; espacios?: UsoEspacio[]; onFiltrar?: (espacioId: number) => void }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return <Vacio texto="No hubo tutorías ni eventos con espacio en el período." />;
  const idPorNombre = new Map((espacios ?? []).map((e) => [e.nombre, e.espacioId]));
  const excedidos = filas.filter((f) => estado(f) === 'excedido').length;
  const chicos = filas.filter((f) => estado(f) === 'sobredimensionado').length;
  return (
    <div>
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-utec-red/12 px-2 py-0.5 font-medium text-utec-red">
            <AlertTriangle className="h-3 w-3" /> {excedidos} {excedidos === 1 ? 'excede' : 'exceden'} el espacio
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-utec-orange/12 px-2 py-0.5 font-medium text-utec-orange">
            {chicos} con espacio de sobra
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-muted/50 px-2.5 py-1.5 text-2xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-6 rounded-full border border-foreground/20 bg-muted" />barra entera = capacidad del espacio</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ backgroundColor: tema.categorias[0] }} />inscriptos</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-[3px] rounded bg-foreground" />cupo ofrecido</span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {filas.slice(0, limite).map((f) => {
          const capacidad = Math.max(0, Number(f.capacidad ?? 0));
          const inscriptos = Number(f.inscriptos);
          const cupo = f.cupo == null ? null : Number(f.cupo);
          const e = estado(f);
          const relleno = e === 'excedido' ? tema.danado : e === 'sobredimensionado' ? tema.mantenimiento : tema.categorias[0];
          const espacioId = f.espacioNombre ? idPorNombre.get(f.espacioNombre) : undefined;
          const { className: claseClic, ...clic } = filtrable(f.espacioNombre ?? '', onFiltrar && espacioId != null ? () => onFiltrar(espacioId) : null);
          const Icono = f.tipo === 'EVENTO' ? Presentation : Users;
          const pct = (v: number) => (capacidad > 0 ? Math.min(100, (v / capacidad) * 100) : 0);
          return (
            <li key={`${f.tipo}-${f.id}`} {...clic} className={`-mx-1 px-1 py-0.5 ${claseClic ? `${HOVER_FILTRO} ${claseClic}` : ''}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icono className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={f.tipo === 'EVENTO' ? 'Evento' : 'Tutoría'} />
                  <span className="truncate font-medium" title={f.titulo}>{f.titulo}</span>
                </span>
                {e === 'excedido' && <span className="shrink-0 rounded-full bg-utec-red/12 px-2 py-0.5 text-2xs font-semibold text-utec-red">Excede</span>}
                {e === 'sobredimensionado' && <span className="shrink-0 rounded-full bg-utec-orange/12 px-2 py-0.5 text-2xs font-semibold text-utec-orange">Sobra espacio</span>}
              </div>
              <div
                className="relative h-2.5 rounded-full border border-foreground/10 bg-muted"
                title={`${inscriptos} inscriptos${cupo != null ? ` · cupo ${cupo}` : ''} · espacio para ${capacidad || 'sin dato'}`}
              >
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct(inscriptos)}%`, backgroundColor: relleno }} />
                {cupo != null && capacidad > 0 && (
                  <span className="absolute -inset-y-1 w-[3px] rounded bg-foreground" style={{ left: `calc(${pct(cupo)}% - 1.5px)` }} aria-hidden />
                )}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
                <span className="min-w-0 truncate tabular-nums">
                  <b className="text-foreground">{plural(inscriptos, 'inscripto', 'inscriptos')}</b>
                  {cupo != null && <> · cupo {entero(cupo)}</>}
                  {capacidad > 0 && <> · espacio para {entero(capacidad)}</>}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {fechaCorta(f.fecha.slice(0, 10))}
                  {f.espacioNombre && <> · {f.espacioNombre}</>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {limite != null && filas.length > limite && (
        <p className="mt-3 border-t pt-2 text-center text-xs text-muted-foreground">Y {filas.length - limite} más: ampliá para verlas todas.</p>
      )}
    </div>
  );
}

const plural = (n: number, uno: string, varios: string) => `${entero(n)} ${n === 1 ? uno : varios}`;

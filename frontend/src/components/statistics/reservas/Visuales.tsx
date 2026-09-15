import type { OcupacionEspacio, ResumenCarrera, ResumenEdificio, ResumenReservas } from '@/lib/api/stats';
import { Burbujas } from '../graficos/Burbujas';
import { Dona } from '../graficos/Dona';
import { MapaArbol } from '../graficos/MapaArbol';
import { filtrable, HOVER_FILTRO } from '../graficos/filtrable';
import { useTemaGraficos } from '../graficos/tema';
import { nombreRolPlural } from './formato';

/**
 * Espacios como rectángulos: el tamaño son las horas reservadas y el color
 * qué tan ocupado está contra su horario. Un espacio grande y claro tiene
 * mucho uso en total pero margen; uno chico y oscuro está al tope.
 */
export function MapaOcupacion({ filas, alto = 300, onFiltrar }: Readonly<{ filas: OcupacionEspacio[]; alto?: number; onFiltrar?: (espacioId: number) => void }>) {
  const tema = useTemaGraficos();
  // Escala entre el menos y el más ocupado: con todos entre 30% y 36%, contra
  // el máximo quedaban todos del mismo azul y el color no decía nada.
  const valores = filas.map((o) => Number(o.porcentaje));
  const minimo = Math.min(...valores);
  const rango = Math.max(0.01, Math.max(...valores) - minimo);
  return (
    <div>
      <MapaArbol
        alto={alto}
        nodos={filas.map((o) => {
          const t = 0.15 + ((Number(o.porcentaje) - minimo) / rango) * 0.85;
          return {
            nombre: o.espacioNombre,
            valor: Number(o.horasReservadas),
            color: tema.secuencial(t),
            texto: tema.secuencialTexto(t),
            detalle: `${Math.round(Number(o.porcentaje))}% · ${Math.round(Number(o.horasReservadas))} h${o.edificioNombre ? ` · ${o.edificioNombre}` : ''}`,
            alClic: onFiltrar ? () => onFiltrar(o.espacioId) : undefined,
          };
        })}
      />
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        {Math.round(minimo)}%
        {[0.1, 0.35, 0.6, 0.85, 1].map((t) => (
          <span key={t} className="h-3 w-4 rounded-sm" style={{ backgroundColor: tema.secuencial(t) }} />
        ))}
        {Math.round(minimo + rango)}% de ocupación
      </div>
    </div>
  );
}

export function DonaEdificios({ filas, tamano = 130, onFiltrar }: Readonly<{ filas: ResumenEdificio[]; tamano?: number; onFiltrar?: (edificioId: number) => void }>) {
  const tema = useTemaGraficos();
  const ordenadas = [...filas].sort((a, b) => Number(b.cantReservas) - Number(a.cantReservas));
  // Más de seis porciones no se leen: el resto va junto.
  const principales = ordenadas.slice(0, 5);
  const resto = ordenadas.slice(5).reduce((a, e) => a + Number(e.cantReservas), 0);
  return (
    <Dona
      tamano={tamano}
      leyendaCentro="aprobadas"
      porciones={[
        ...principales.map((e, i) => ({
          nombre: e.edificioNombre,
          valor: Number(e.cantReservas),
          color: tema.categorias[i],
          alClic: onFiltrar && e.edificioId != null ? () => onFiltrar(e.edificioId!) : undefined,
        })),
        ...(resto > 0 ? [{ nombre: 'Otros', valor: resto, color: tema.categorias[5] }] : []),
      ]}
    />
  );
}

// Color fijo por rol: no cambia si un período no tiene externos.
const ORDEN_ROLES = ['DOCENTE', 'ESTUDIANTE', 'EXTERNO', 'ANALISTA', 'ADMIN', 'MANTENIMIENTO'];

export function DonaRoles({ filas, tamano = 140, onFiltrar }: Readonly<{ filas: ResumenReservas['porRol']; tamano?: number; onFiltrar?: (rol: string) => void }>) {
  const tema = useTemaGraficos();
  if (filas.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período.</p>;
  const porRol = new Map(filas.map((f) => [f.nombre, f]));
  return (
    <div className="space-y-3">
      <Dona
        tamano={tamano}
        leyendaCentro="reservas"
        porciones={ORDEN_ROLES.filter((r) => porRol.has(r)).map((r) => ({
          nombre: nombreRolPlural(r),
          valor: porRol.get(r)!.total,
          color: tema.categorias[ORDEN_ROLES.indexOf(r)],
          alClic: onFiltrar ? () => onFiltrar(r) : undefined,
        }))}
      />
      <ul className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
        {ORDEN_ROLES.filter((r) => porRol.has(r)).map((r) => {
          const f = porRol.get(r)!;
          return (
            <li key={r} {...filtrable(nombreRolPlural(r), onFiltrar ? () => onFiltrar(r) : null)} className={`flex justify-between ${onFiltrar ? `${HOVER_FILTRO} -mx-1 px-1` : ''}`}>
              <span>{nombreRolPlural(r)}</span>
              <span className="tabular-nums">
                se aprueba el <b className="text-foreground">{f.total > 0 ? Math.round((f.aprobadas / f.total) * 100) : 0}%</b>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Carreras en un plano volumen × tasa de cancelación, con el promedio de referencia. */
export function BurbujasCarreras({ filas, alto = 300, onFiltrar }: Readonly<{ filas: ResumenCarrera[]; alto?: number; onFiltrar?: (carreraId: number) => void }>) {
  const carreras = filas.filter((c) => c.carreraId != null);
  const puntos = carreras.map((c) => ({
    nombre: c.carreraNombre,
    x: Number(c.aprobadas) + Number(c.canceladas),
    y: Number(c.tasaCancelacion),
    z: Math.max(1, Number(c.canceladasTarde)),
    alClic: onFiltrar ? () => onFiltrar(c.carreraId!) : undefined,
  }));
  const totalCanceladas = carreras.reduce((a, c) => a + Number(c.canceladas), 0);
  const totalResueltas = carreras.reduce((a, c) => a + Number(c.aprobadas) + Number(c.canceladas), 0);
  const promedio = totalResueltas > 0 ? (totalCanceladas / totalResueltas) * 100 : undefined;
  const altas = puntos.filter((p) => p.y > 15);

  return (
    <div>
      <Burbujas
        puntos={puntos}
        ejeX="Reservas resueltas"
        ejeY="Cancelación"
        tamano="Canceladas tarde"
        referenciaY={promedio}
        alertaY={15}
        formatoY={(v) => `${Math.round(v)}%`}
        alto={alto}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {altas.length > 0
          ? `${altas.length} ${altas.length === 1 ? 'carrera cancela' : 'carreras cancelan'} más del 15% (en rojo): ${altas.map((a) => a.nombre).slice(0, 3).join(', ')}${altas.length > 3 ? '…' : ''}.`
          : `Ninguna carrera cancela más del 15%${promedio != null ? `; el promedio es ${promedio.toFixed(1)}%` : ''}.`}
      </p>
    </div>
  );
}

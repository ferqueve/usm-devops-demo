import { Link } from 'react-router-dom';
import type { EstadoInventario } from '@/lib/api/stats';
import { Dona } from '../graficos/Dona';
import { MapaArbol } from '../graficos/MapaArbol';
import { Medidor } from '../graficos/Medidor';
import { Waffle } from '../graficos/Waffle';
import { useTemaGraficos } from '../graficos/tema';
import { porcentaje } from '../reservas/formato';

/** Reparto de estados del parque, con la disponibilidad en el centro. */
export function DonaEstados({ totales, tamano = 150 }: Readonly<{ totales: EstadoInventario['totales']; tamano?: number }>) {
  const tema = useTemaGraficos();
  return (
    <Dona
      tamano={tamano}
      centro={`${porcentaje(totales.disponibles, totales.items)}%`}
      leyendaCentro="disponible"
      porciones={[
        { nombre: 'Disponibles', valor: totales.disponibles, color: tema.disponible },
        { nombre: 'En mantenimiento', valor: totales.mantenimiento, color: tema.mantenimiento },
        { nombre: 'Dañados', valor: totales.danados, color: tema.danado },
      ]}
    />
  );
}

/** Qué tan cubiertos están los espacios y qué tanto del parque tiene lugar asignado. */
export function MedidoresCobertura({ estado, grande = false }: Readonly<{ estado: EstadoInventario; grande?: boolean }>) {
  const { totales, cobertura } = estado;
  const asignados = totales.items - totales.sinEspacio;
  return (
    <div className="grid grid-cols-2 gap-4">
      {cobertura ? (
        <Medidor
          valor={porcentaje(cobertura.conInventario, cobertura.espacios)}
          etiqueta="Espacios equipados"
          detalle={`${cobertura.conInventario} de ${cobertura.espacios}`}
          umbrales={{ alerta: 50, aviso: 80 }}
          ancho={grande ? 240 : 150}
        />
      ) : (
        <Medidor
          valor={porcentaje(estado.porTipo.filter((t) => t.items > 0).length, estado.opciones.tipos.length)}
          etiqueta="Tipos presentes"
          detalle="en este espacio"
          ancho={grande ? 240 : 150}
        />
      )}
      <Medidor
        valor={porcentaje(asignados, totales.items)}
        etiqueta="Con espacio asignado"
        detalle={`${asignados} de ${totales.items} items`}
        umbrales={{ alerta: 70, aviso: 90 }}
        ancho={grande ? 240 : 150}
      />
    </div>
  );
}

/** Antigüedad por fecha de alta, en cien cuadraditos. */
export function WaffleAntiguedad({ a }: Readonly<{ a: EstadoInventario['antiguedad'] }>) {
  const tema = useTemaGraficos();
  return (
    <div className="space-y-4">
      <Waffle
        grupos={[
          { nombre: 'Menos de 30 días', valor: a.menosDe30Dias, color: tema.secuencial(0.2) },
          { nombre: '30 a 90 días', valor: a.de30a90Dias, color: tema.secuencial(0.45) },
          { nombre: '90 días a 1 año', valor: a.de90DiasAUnAnio, color: tema.secuencial(0.7) },
          { nombre: 'Más de 1 año', valor: a.masDeUnAnio, color: tema.secuencial(1) },
        ]}
      />
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <b className="tabular-nums">{a.sinCambiosHace6Meses.toLocaleString('es-UY')}</b>{' '}
        <span className="text-muted-foreground">
          {a.sinCambiosHace6Meses === 1 ? 'item no se revisó' : 'items no se revisaron'} en más de seis meses
        </span>
        {a.sinCambiosHace6Meses > 0 && (
          <Link to="/inventory" className="ml-1 text-xs font-medium text-utec-blue hover:underline dark:text-utec-cyan">
            ver inventario
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Tipos como rectángulos: el tamaño son los items y el color cuánto de ese
 * tipo tiene problemas. Un rectángulo grande y rojo es un problema grande.
 * Por items y no por unidades: 428 sillas tapaban a los proyectores, que son
 * pocos y son los que se rompen.
 */
export function MapaTipos({ porTipo, alto = 260 }: Readonly<{ porTipo: EstadoInventario['porTipo']; alto?: number }>) {
  const tema = useTemaGraficos();
  return (
    <div>
      <MapaArbol
        alto={alto}
        nodos={porTipo.map((t) => {
          const problemas = t.mantenimiento + t.danados;
          const pct = porcentaje(problemas, t.items);
          const color = problemas === 0 ? tema.disponible : pct >= 30 ? tema.danado : tema.mantenimiento;
          return {
            nombre: t.nombre,
            valor: t.items,
            color,
            texto: '#ffffff',
            detalle: `${t.items} ${t.items === 1 ? 'item' : 'items'} · ${problemas > 0 ? `${problemas} con problemas` : 'todo disponible'}`,
          };
        })}
      />
      <ul className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tema.disponible }} />sin problemas</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tema.mantenimiento }} />menos del 30% con problemas</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tema.danado }} />30% o más</li>
      </ul>
    </div>
  );
}

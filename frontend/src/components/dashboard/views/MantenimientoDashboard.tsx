import { Boxes, ClipboardList, Leaf, MapPin, Wrench } from 'lucide-react';
import type { InventoryStats } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { EspacioFila, ItemFila } from './_components/Filas';
import { Anillo, BarrasHorizontales, UTEC } from './_components/Graficos';
import { Hero } from './_components/Hero';

interface EspaciosStats {
  totalEspacios: number;
  disponibles: number;
  enMantenimiento: number;
  ocupados: number;
}

interface MantenimientoDashboardProps {
  data: DashboardData | null;
  loading: boolean;
  inventarioStats: InventoryStats | null;
  espaciosStats: EspaciosStats | null;
  pendingInventoryRequests: number;
}

/**
 * Lo de mantenimiento: qué hay que arreglar y dónde, no solo cuántos son.
 *
 * Antes la pantalla terminaba en tres líneas de alerta: decía "1 item dañado"
 * sin decir cuál, y "2 espacios fuera de servicio" sin decir dónde.
 */
export function MantenimientoDashboard({
  data, loading, inventarioStats, espaciosStats, pendingInventoryRequests,
}: Readonly<MantenimientoDashboardProps>) {
  const inv = inventarioStats;
  const esp = espaciosStats;
  const items = data?.inventarioAtencion ?? [];
  const espaciosCaidos = data?.espaciosFueraDeServicio ?? [];
  const verde = data?.sostenibilidad;
  const parque = [
    { nombre: 'Disponibles', valor: inv?.disponibles ?? 0, color: UTEC.verde },
    { nombre: 'En mantenimiento', valor: inv?.mantenimiento ?? 0, color: UTEC.naranja },
    { nombre: 'Dañados', valor: inv?.danados ?? 0, color: UTEC.rojo },
    { nombre: 'Sin asignar', valor: inv?.sinAsignar ?? 0, color: UTEC.amarillo },
  ];
  const barrasEspacios = [
    { nombre: 'Operativos', valor: esp?.disponibles ?? 0 },
    { nombre: 'Ocupados', valor: esp?.ocupados ?? 0 },
    { nombre: 'Fuera de servicio', valor: Math.max(0, (esp?.totalEspacios ?? 0) - (esp?.disponibles ?? 0) - (esp?.ocupados ?? 0)) },
  ];

  // El porcentaje sale de los dos numeros que ya tenemos: pedirselo al backend
  // era una columna mas para una division.
  const porcentajeDisponibles = inv && inv.totalItems > 0
    ? Math.round((inv.disponibles / inv.totalItems) * 100)
    : 0;

  const masUrgente = items[0];
  // "Fuera de servicio" es todo lo que no está disponible, no solo lo que está
  // en MANTENIMIENTO.
  const fueraDeServicio = espaciosCaidos.length > 0
    ? espaciosCaidos.length
    : Math.max(0, (esp?.totalEspacios ?? 0) - (esp?.disponibles ?? 0));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {masUrgente ? (
        <Hero
          etiqueta="LO MÁS URGENTE"
          titulo={masUrgente.titulo}
          detalle={masUrgente.motivo}
          icono={Wrench}
          patron="topografia"
          foco={{ valor: `${masUrgente.urgencia}%`, leyenda: 'urgencia' }}
          accion={{ label: 'Inventario', to: '/inventory' }}
        />
      ) : (
        <Hero
          etiqueta="EL PARQUE"
          titulo={`${inv?.disponibles ?? 0} de ${inv?.totalItems ?? 0} items operativos`}
          detalle={`${fueraDeServicio} espacio${fueraDeServicio === 1 ? '' : 's'} fuera de servicio`}
          icono={Boxes}
          patron="topografia"
          foco={{ valor: `${porcentajeDisponibles}%`, leyenda: 'disponible' }}
          accion={{ label: 'Inventario', to: '/inventory' }}
        />
      )}

      <StatStrip
        loading={loading}
        items={[
          { label: 'Items', value: inv?.totalItems ?? 0, hint: `${inv?.tiposUnicos ?? 0} tipos`, icon: Boxes, bg: 'blue', to: '/inventory' },
          { label: 'Disponibles', value: inv?.disponibles ?? 0, hint: `${porcentajeDisponibles}% del parque`, bg: 'green', to: '/inventory' },
          { label: 'Mantenimiento', value: inv?.mantenimiento ?? 0, hint: 'requieren reparación', icon: Wrench, bg: 'orange', to: '/inventory' },
          { label: 'Dañados', value: inv?.danados ?? 0, hint: (inv?.danados ?? 0) > 0 ? 'fuera de uso' : 'sin novedad', bg: 'red', to: '/inventory' },
          { label: 'Solicitudes', value: pendingInventoryRequests, hint: 'por responder', icon: ClipboardList, bg: 'yellow', to: '/inventory/requests' },
          { label: 'Espacios', value: `${esp?.disponibles ?? 0}/${esp?.totalEspacios ?? 0}`, hint: 'operativos', icon: MapPin, bg: 'cyan', to: '/rooms' },
        ]}
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
        <div className="grid min-h-0 grid-rows-2 gap-3">
          <Panel title="El parque" count={`${inv?.totalItems ?? 0} items`} accentColor="#184897" action={{ label: 'inventario', to: '/inventory' }}>
            <Anillo porciones={parque} leyendaCentro="items" alto={118} />
          </Panel>

          <Panel title="Los espacios" count={`${esp?.totalEspacios ?? 0} en total`} accentColor="#00c7ff" action={{ label: 'espacios', to: '/rooms' }} scroll>
            <BarrasHorizontales datos={barrasEspacios} multicolor />
          </Panel>
        </div>

        <Panel
          title="Items a reparar"
          count={items.length || undefined}
          accentColor="#e8630a"
          action={{ label: 'inventario', to: '/inventory' }}
          scroll
        >
          {items.length > 0 ? (
            <div className="divide-y divide-border/60">
              {items.map((i) => <ItemFila key={i.id} item={i} />)}
            </div>
          ) : (
            <EmptyState title="Ningún item pide atención." />
          )}
        </Panel>

        <div className="grid min-h-0 grid-rows-2 gap-3">
          <Panel
            title="Espacios fuera de servicio"
            count={espaciosCaidos.length || undefined}
            accentColor="#e2001a"
            action={{ label: 'espacios', to: '/rooms' }}
            scroll
          >
            {espaciosCaidos.length > 0 ? (
              <div className="divide-y divide-border/60">
                {espaciosCaidos.map((e) => <EspacioFila key={e.id} espacio={e} />)}
              </div>
            ) : (
              <EmptyState title="Todos operativos." />
            )}
          </Panel>

          <Panel title="Impacto ambiental" accentColor="#86bb4c" action={{ label: 'ver más', to: '/sostenibilidad' }}>
            {verde ? (
              <div className="flex h-full flex-col justify-center gap-2 py-1">
                <div className="flex items-baseline gap-2">
                  <Leaf className="h-4 w-4 shrink-0 text-utec-green" />
                  <span className="text-2xl font-semibold tabular-nums">
                    {verde.hojasEvitadas.toLocaleString('es-UY')}
                  </span>
                  <span className="text-sm text-muted-foreground">hojas evitadas</span>
                </div>
                <div className="flex gap-5 text-sm">
                  <span>
                    <b className="tabular-nums">{verde.arbolesSalvados.toFixed(1)}</b>{' '}
                    <span className="text-muted-foreground">árboles</span>
                  </span>
                  <span>
                    <b className="tabular-nums">{Math.round(verde.co2EvitadoKg).toLocaleString('es-UY')} kg</b>{' '}
                    <span className="text-muted-foreground">de CO₂</span>
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState title="Sin datos." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

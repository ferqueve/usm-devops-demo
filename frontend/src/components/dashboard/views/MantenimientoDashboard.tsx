import { Link } from 'react-router-dom';
import { AlertCircle, Boxes, ClipboardList, Leaf, MapPin, Wrench } from 'lucide-react';
import type { InventoryStats } from '@/lib/types/spaces';
import type { DashboardData } from '@/lib/api/dashboard';
import { StatStrip } from './_components/StatStrip';
import { Panel } from './_components/Panel';
import { EmptyState } from './_components/EmptyState';
import { EspacioFila, ItemFila } from './_components/Filas';
import { Anillo, BarrasHorizontales, UTEC } from './_components/Graficos';

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

interface AlertaRow {
  icon: typeof AlertCircle;
  tone: 'amber' | 'red';
  text: React.ReactNode;
  to: string;
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

  const alertas: AlertaRow[] = [];
  if (pendingInventoryRequests > 0) {
    alertas.push({
      icon: ClipboardList,
      tone: 'amber',
      to: '/inventory/requests',
      text: <><b>{pendingInventoryRequests}</b> solicitud{pendingInventoryRequests === 1 ? '' : 'es'} de inventario por responder</>,
    });
  }
  if ((inv?.danados ?? 0) > 0) {
    alertas.push({
      icon: AlertCircle,
      tone: 'red',
      to: '/inventory',
      text: <><b>{inv!.danados}</b> item{inv!.danados === 1 ? '' : 's'} dañado{inv!.danados === 1 ? '' : 's'}</>,
    });
  }
  // "Fuera de servicio" es todo lo que no esta disponible, no solo lo que esta
  // en MANTENIMIENTO: contando solo ese estado la alerta decia 2 mientras la
  // tarjeta decia 11/14 y el panel listaba 3.
  const fueraDeServicio = espaciosCaidos.length > 0
    ? espaciosCaidos.length
    : Math.max(0, (esp?.totalEspacios ?? 0) - (esp?.disponibles ?? 0));
  if (fueraDeServicio > 0) {
    alertas.push({
      icon: Wrench,
      tone: 'amber',
      to: '/rooms',
      text: <><b>{fueraDeServicio}</b> espacio{fueraDeServicio === 1 ? '' : 's'} fuera de servicio</>,
    });
  }

  return (
    <div className="space-y-5">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Items', value: inv?.totalItems ?? 0, hint: `${inv?.tiposUnicos ?? 0} tipos`, icon: Boxes, bg: 'blue', to: '/inventory' },
          { label: 'Disponibles', value: inv?.disponibles ?? 0, hint: `${porcentajeDisponibles}% del parque`, bg: 'green', to: '/inventory' },
          { label: 'Mantenimiento', value: inv?.mantenimiento ?? 0, hint: 'requieren reparación', icon: Wrench, bg: 'orange', to: '/inventory' },
          { label: 'Dañados', value: inv?.danados ?? 0, hint: (inv?.danados ?? 0) > 0 ? 'fuera de uso' : 'sin novedad', bg: 'red', to: '/inventory' },
          { label: 'Sin asignar', value: inv?.sinAsignar ?? 0, hint: 'esperando ubicación', bg: 'yellow', to: '/inventory' },
          { label: 'Espacios', value: `${esp?.disponibles ?? 0}/${esp?.totalEspacios ?? 0}`, hint: 'operativos', icon: MapPin, bg: 'cyan', to: '/rooms' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="El parque de inventario" count={`${inv?.totalItems ?? 0} items`} accentColor="#184897" action={{ label: 'inventario', to: '/inventory' }}>
          <Anillo porciones={parque} leyendaCentro="items" />
        </Panel>

        <Panel title="Los espacios" count={`${esp?.totalEspacios ?? 0} en total`} accentColor="#00c7ff" action={{ label: 'espacios', to: '/rooms' }}>
          <BarrasHorizontales datos={barrasEspacios} alto={150} multicolor />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Items a reparar"
          count={items.length || undefined}
          accentColor="#e8630a"
          action={{ label: 'inventario', to: '/inventory' }}
        >
          {items.length > 0 ? (
            <div className="divide-y divide-border/60">
              {items.map((i) => <ItemFila key={i.id} item={i} />)}
            </div>
          ) : (
            <EmptyState title="Ningún item pide atención." />
          )}
        </Panel>

        <Panel
          title="Espacios fuera de servicio"
          count={espaciosCaidos.length || undefined}
          accentColor="#e2001a"
          action={{ label: 'espacios', to: '/rooms' }}
        >
          {espaciosCaidos.length > 0 ? (
            <div className="divide-y divide-border/60">
              {espaciosCaidos.map((e) => <EspacioFila key={e.id} espacio={e} />)}
            </div>
          ) : (
            <EmptyState title="Todos los espacios operativos." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="Pendientes" count={alertas.length || undefined} accentColor="#F6CA21">
          {alertas.length > 0 ? (
            <div className="divide-y divide-border/60">
              {alertas.map((a) => {
                const Icon = a.icon;
                const toneClass = a.tone === 'red' ? 'text-utec-red' : 'text-utec-orange';
                return (
                  <Link
                    key={a.to + (typeof a.text === 'string' ? a.text : '')}
                    to={a.to}
                    className="-mx-2 flex items-center gap-3 rounded-sm px-2 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <Icon className={`h-4 w-4 ${toneClass} shrink-0`} />
                    <span className="min-w-0 flex-1 truncate text-sm">{a.text}</span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">revisar</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Todo en orden." />
          )}
        </Panel>

        <Panel title="Impacto ambiental" accentColor="#86bb4c" action={{ label: 'ver más', to: '/sostenibilidad' }}>
          {verde ? (
            <div className="flex h-full flex-col justify-center gap-3 py-1">
              <div className="flex items-baseline gap-2">
                <Leaf className="h-4 w-4 shrink-0 text-utec-green" />
                <span className="text-2xl font-semibold tabular-nums">
                  {verde.hojasEvitadas.toLocaleString('es-UY')}
                </span>
                <span className="text-sm text-muted-foreground">hojas evitadas</span>
              </div>
              <div className="flex gap-6 text-sm">
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
            <EmptyState title="Sin datos de sostenibilidad." />
          )}
        </Panel>
      </div>
    </div>
  );
}

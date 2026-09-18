import React from 'react';

import { Panel } from '@/components/common/Panel';
import { EstadoCarga } from '@/components/common/EstadoCarga';
import { MARCA } from '@/lib/design/paleta';

export interface StatsListItem {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StatsListWidgetProps {
  title: string;
  TitleIcon: React.ComponentType<{ className?: string }>;
  /** `null` significa que no llegó el dato. */
  items: StatsListItem[] | null;
  loading: boolean;
  /** El mensaje del error, si la llamada falló. */
  error?: string | null;
  alReintentar?: () => void;
  /** Qué decir cuando no hay dato. */
  textoVacio?: string;
  /** Cuántas filas de esqueleto mostrar mientras carga. */
  skeletonRows?: number;
}

/**
 * Widget de dashboard: una lista de «etiqueta + número».
 *
 * Con `items` en null y `loading` en false no dibujaba nada. El comentario
 * que tenía lo decía —«consumer may want to render a fallback at a higher
 * level»— y ninguno de los dos consumidores lo hacía: si la llamada fallaba,
 * el widget de Inventario desaparecía del dashboard sin dejar rastro.
 */
export default function StatsListWidget({
  title,
  TitleIcon,
  items,
  loading,
  error,
  alReintentar,
  textoVacio = 'No se pudo traer el detalle.',
  skeletonRows = 4,
}: Readonly<StatsListWidgetProps>) {
  return (
    <Panel title={title} icon={<TitleIcon />} accentColor={MARCA.azul}>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: skeletonRows }, (_, i) => i).map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
              <div className="h-6 w-12 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <EstadoCarga
          cargando={false}
          error={error}
          alReintentar={alReintentar}
          vacio={!items}
          textoVacio={textoVacio}
        >
          <div className="space-y-3">
            {(items ?? []).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${item.color}`} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">{item.value}</span>
                </div>
              );
            })}
          </div>
        </EstadoCarga>
      )}
    </Panel>
  );
}

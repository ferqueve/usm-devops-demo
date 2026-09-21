import { useState, type ReactNode } from 'react';
import { Info, Lightbulb, Maximize2, MoonStar, Radio, Camera, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';

export type Fuente = 'vivo' | 'noche' | 'foto' | 'modelo';

export interface Explicacion {
  /** Qué pregunta responde, en una o dos oraciones. */
  que: string;
  /** De dónde sale el número y cómo se calcula. */
  como: string;
  /** Cómo leerlo o qué mirar primero. */
  lectura?: string;
  /** Límites o trampas del dato. */
  ojo?: string;
  fuente: Fuente;
}

const FUENTES: Record<Fuente, { icono: typeof Radio; texto: string }> = {
  vivo: { icono: Radio, texto: 'En vivo: se calcula sobre las reservas al momento de abrir la pantalla.' },
  noche: { icono: MoonStar, texto: 'Hasta anoche: sale de las tablas que se recalculan cada madrugada.' },
  foto: { icono: Camera, texto: 'Foto diaria: el estado del inventario que se registra cada madrugada.' },
  modelo: { icono: Calculator, texto: 'Estado actual del inventario, calculado al abrir la pantalla.' },
};

interface Props {
  title: string;
  count?: string | number;
  accentColor?: string;
  action?: { label: string; to: string };
  explicacion: Explicacion;
  /** Con función, el contenido sabe si se muestra en el modal para agrandarse. */
  children: ReactNode | ((ampliado: boolean) => ReactNode);
  className?: string;
  /** Centra el contenido en el alto del panel (donas, medidores). */
  centrar?: boolean;
  /** El cuerpo scrollea por dentro en vez de estirar la tarjeta. */
  scroll?: boolean;
  /** Sin padding, para tablas que dibujan sus propios bordes. */
  flush?: boolean;
}

/**
 * Panel de estadísticas: un `Panel` más el botón que abre la misma
 * estadística en grande, con qué muestra, cómo se calcula y cómo leerla.
 *
 * El encabezado no se dibuja acá. Estaba duplicado —mismo fondo, misma barra
 * de acento, mismo enlace— con otro padding, así que un panel de dashboard y
 * uno de estadísticas no alineaban aunque estuvieran uno al lado del otro.
 */
export function PanelEstadistica({
  title,
  count,
  accentColor = MARCA.amarillo,
  action,
  explicacion,
  children,
  className,
  centrar = false,
  scroll = false,
  flush = false,
}: Readonly<Props>) {
  const [abierto, setAbierto] = useState(false);
  const contenido = (ampliado: boolean) => (typeof children === 'function' ? children(ampliado) : children);
  const Fuente = FUENTES[explicacion.fuente];

  return (
    <>
      <Panel
        title={title}
        count={count}
        accentColor={accentColor}
        action={action}
        className={className}
        centrar={centrar}
        scroll={scroll}
        flush={flush}
        altoCompleto
        acciones={
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label={`Ampliar y explicar: ${title}`}
            title="Ampliar y ver la explicación"
            className="inline-flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <Maximize2 className="size-3.5" />
          </button>
        }
      >
        {contenido(false)}
      </Panel>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent
          // Sin esto el foco cae en el primer sector del gráfico y le dibuja un recuadro negro.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="gap-0 overflow-hidden p-0 sm:max-w-6xl [&_.recharts-surface]:outline-none [&_.recharts-sector]:outline-none [&>button]:top-3.5 [&>button]:text-white [&>button]:ring-offset-utec-dark [&>button]:focus:ring-white/40">
          <div className="flex items-center gap-2.5 bg-chrome px-5 py-3 pr-12 text-white">
            <span className="h-5 w-1 shrink-0 rounded-sm" style={{ backgroundColor: accentColor }} aria-hidden />
            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
            {count !== undefined && count !== '' && <span className="truncate text-sm text-white/60">{count}</span>}
          </div>
          <DialogDescription className="sr-only">{explicacion.que}</DialogDescription>

          {/* Bloque en celular: con grid y alto máximo, las filas se achicaban y la explicación pisaba al gráfico. */}
          <div className="block max-h-[calc(90vh-52px)] overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 p-5">{contenido(true)}</div>

            <aside className="space-y-4 border-t bg-muted/40 p-5 text-sm lg:border-l lg:border-t-0">
              <Bloque icono={Info} titulo="Qué muestra">{explicacion.que}</Bloque>
              <Bloque icono={Calculator} titulo="Cómo se calcula">{explicacion.como}</Bloque>
              {explicacion.lectura && <Bloque icono={Lightbulb} titulo="Cómo leerlo">{explicacion.lectura}</Bloque>}
              {explicacion.ojo && (
                <div className="rounded-lg border border-utec-orange/30 bg-utec-orange/10 px-3 py-2 text-xs leading-relaxed">
                  <b>Para tener en cuenta:</b> {explicacion.ojo}
                </div>
              )}
              <div className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
                <Fuente.icono className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{Fuente.texto}</span>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Bloque({ icono: Icono, titulo, children }: Readonly<{ icono: typeof Info; titulo: string; children: ReactNode }>) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {titulo}
      </div>
      <p className="leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

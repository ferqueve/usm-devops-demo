import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Brain, Info, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EventoPatternBg } from '@/components/ui/backgrounds/eventPatterns';
import { MARCA } from '@/lib/design/paleta';

/** Lo que cada vista necesita saber del botón de reentrenar de la barra. */
export interface Entrenamiento {
  esAdmin: boolean;
  reentrenando: boolean;
  /** Entrena el modelo de la vista. */
  entrenar: () => void;
}

/**
 * Pantalla de "todavía no hay modelo". El admin tiene el botón para entrenar
 * justo acá: tener que ir a buscarlo arriba cuando la vista está vacía no se
 * entendía.
 */
export function SinModelo({ titulo, detalle, entrenamiento, textoBoton }: Readonly<{
  titulo: string;
  detalle: string;
  entrenamiento: Entrenamiento;
  textoBoton: string;
}>) {
  const { esAdmin, reentrenando, entrenar } = entrenamiento;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-chrome px-6 py-14 text-center text-white">
      <EventoPatternBg patron="nodos" />
      <div className="relative mx-auto max-w-md">
        <Brain className="mx-auto mb-3 h-10 w-10 text-white/60" />
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <p className="mt-2 text-sm text-white/70">{esAdmin ? detalle : 'Un administrador tiene que entrenarlo primero.'}</p>
        {esAdmin && (
          <Button onClick={entrenar} disabled={reentrenando} className="mt-5 h-9 bg-card px-4 text-sm font-semibold text-chrome hover:bg-[#e9eaec]">
            {reentrenando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">{reentrenando ? 'Entrenando…' : textoBoton}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Aviso a lo ancho: de confiabilidad (naranja) o informativo (azul). */
export function Aviso({ tono = 'alerta', titulo, children }: Readonly<{ tono?: 'alerta' | 'info'; titulo?: string; children: ReactNode }>) {
  const Icono = tono === 'alerta' ? AlertTriangle : Info;
  return (
    <div
      role={tono === 'alerta' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        tono === 'alerta' ? 'border-utec-orange/40 bg-utec-orange/10' : 'border-utec-blue/25 bg-utec-blue/5 dark:border-utec-cyan/25 dark:bg-utec-cyan/5'
      }`}
    >
      <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${tono === 'alerta' ? 'text-marca-naranja-texto' : 'text-marca-azul-texto dark:text-marca-cian-texto'}`} />
      <div className="min-w-0 leading-relaxed">
        {titulo && <b className="mr-1">{titulo}</b>}
        {children}
      </div>
    </div>
  );
}

/**
 * Lo que hay que llevarse si se mira una sola cosa: la frase principal de la
 * vista sobre el fondo oscuro con nodos, y a la derecha un anillo con el dato
 * que la acompaña. Es la identidad de Predicciones en las tres vistas.
 */
export function Hero({ rango, titulo, detalle, anillo, extra }: Readonly<{
  /** Línea chica de arriba: horizonte, alcance. */
  rango: ReactNode;
  titulo: ReactNode;
  detalle?: ReactNode;
  anillo?: { valor: number; texto: string; color?: string } | null;
  /** Algo más debajo del detalle (un chip para volver, un botón). */
  extra?: ReactNode;
}>) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-chrome px-5 py-5 text-white sm:px-6">
      <EventoPatternBg patron="nodos" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1320]/90 via-[#0e1320]/40 to-transparent" />
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-white/60">{rango}</div>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{titulo}</h2>
          {detalle && <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">{detalle}</p>}
          {extra && <div className="mt-3">{extra}</div>}
        </div>

        {anillo && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-4xl font-bold leading-none">{Math.round(anillo.valor)}%</div>
              <div className="mt-1 text-2xs text-white/60">{anillo.texto}</div>
            </div>
            <Anillo porcentaje={anillo.valor} color={anillo.color} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Chip neutro sobre el hero: que baje la demanda no es malo, puede ser receso. */
export function ChipHero({ children }: Readonly<{ children: ReactNode }>) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">{children}</span>;
}

/** Anillo del hero. */
export function Anillo({ porcentaje, color = MARCA.verde }: Readonly<{ porcentaje: number; color?: string }>) {
  const radio = 22;
  const circunferencia = 2 * Math.PI * radio;
  const valor = Math.max(0, Math.min(100, porcentaje));
  return (
    <svg viewBox="0 0 56 56" aria-hidden className="-rotate-90 shrink-0" style={{ width: 56, height: 56 }}>
      <circle cx="28" cy="28" r={radio} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
      <circle
        cx="28"
        cy="28"
        r={radio}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(valor / 100) * circunferencia} ${circunferencia}`}
      />
    </svg>
  );
}

export function Esqueleto() {
  return (
    <div className="space-y-3" aria-busy>
      <div className="h-[132px] animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-muted" />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-[380px] animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-[380px] animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function NoCargo() {
  return (
    <p className="rounded-xl border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">
      No se pudieron cargar las predicciones. Probá actualizar.
    </p>
  );
}

/** Chip de estado con ícono y texto: el color nunca va solo. */
export function Chip({ color, icono: Icono, children, titulo }: Readonly<{ color: string; icono?: LucideIcon; children: ReactNode; titulo?: string }>) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold"
      style={{ backgroundColor: `${color}1f`, color }}
      title={titulo}
    >
      {Icono && <Icono className="h-3 w-3" />}
      {children}
    </span>
  );
}

/** Pie de la vista con de dónde sale el modelo. */
export function NotaModelo({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="px-1 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

/** Un dato chico de ficha técnica (algoritmo, histórico, validación). */
export function Dato({ etiqueta, valor }: Readonly<{ etiqueta: string; valor: string }>) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="truncate font-medium">{valor}</dd>
    </div>
  );
}

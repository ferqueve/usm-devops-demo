import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MoonStar } from 'lucide-react';
import { MARCA } from '@/lib/design/paleta';

export interface Destacado {
  etiqueta: string;
  valor: string;
}

interface SeccionProps {
  id: string;
  titulo: string;
  /** La pregunta que responde la sección, en una línea. */
  descripcion: string;
  icono: LucideIcon;
  /** Hex del acento de la sección. */
  color: string;
  /** Dos o tres datos que resumen la sección antes de ver los gráficos. */
  destacados?: Destacado[];
  /** Aclaración de frescura o alcance. */
  nota?: ReactNode;
  children: ReactNode;
}

/** Si un color de fondo pide texto oscuro (luminancia relativa aproximada). */
function esClaro(hex: string): boolean {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** Si un acento casi no se distingue sobre el gris oscuro de la barra. */
function esOscuro(hex: string): boolean {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 100;
}

/**
 * Un bloque de la pantalla de estadísticas, agrupado por la pregunta que
 * responde y no por cómo se calcula.
 */
export function Seccion({ id, titulo, descripcion, icono: Icono, color, destacados = [], nota, children }: Readonly<SeccionProps>) {
  // Tarjeta entera del color institucional de la sección. Sobre amarillo o
  // celeste el blanco no se lee, así que el texto pasa al gris oscuro.
  const tinta = esClaro(color) ? MARCA.oscuro : '#ffffff';
  const cabecera = (
    <div className="relative overflow-hidden rounded-xl px-5 py-4 shadow-sm" style={{ backgroundColor: color, color: tinta }}>
      <Icono className="pointer-events-none absolute -right-4 -top-6 h-32 w-32 opacity-10" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25">
            <Icono className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">{titulo}</h2>
            <p className="text-sm opacity-85">{descripcion}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {destacados.map((d) => (
            <div key={d.etiqueta} className="rounded-lg bg-black/10 px-3 py-1.5 text-right ring-1 ring-black/5">
              <div className="text-2xs uppercase tracking-wide opacity-75">{d.etiqueta}</div>
              <div className="text-sm font-semibold">{d.valor}</div>
            </div>
          ))}
          {nota}
        </div>
      </div>
    </div>
  );

  return (
    <section id={id} className="scroll-mt-28 space-y-3">
      {cabecera}
      {children}
    </section>
  );
}

/** El ancestro más cercano que scrollea en vertical, o null si es la ventana. */
function contenedorConScroll(desde: HTMLElement | null): HTMLElement | null {
  for (let el = desde?.parentElement ?? null; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return null;
}

/**
 * Índice fijo arriba de la vista: marca la sección que se está viendo y lleva
 * a cada una con un clic. La página es larga y no había forma de saltar.
 */
export function IndiceSecciones({
  secciones,
  extra,
  extraEn,
  debajo,
}: Readonly<{
  /**
   * Fila bajo el índice (los filtros aplicados). Va dentro de la barra y no
   * al lado: envuelta con ella en otro div, la barra quedaba presa de ese div
   * y dejaba de ser fija.
   */
  debajo?: ReactNode;
  /** Controles de una sección (filtros), a la derecha del índice. */
  extra?: ReactNode;
  /** Secciones donde se muestra `extra`; sin esto, en todas. */
  extraEn?: string[];
  secciones: Array<{
    id: string;
    titulo: string;
    icono: LucideIcon;
    color: string;
  }>;
}>) {
  const [activa, setActiva] = useState<string | undefined>(secciones[0]?.id);
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // El layout tiene dos <main> anidados y el que scrollea es el de adentro:
    // se busca el contenedor que scrollea de verdad subiendo desde la barra.
    const contenedor = contenedorConScroll(barra.current);
    let cuadro = 0;
    const actualizar = () => {
      cuadro = 0;
      const desplazado = contenedor ? contenedor.scrollTop : window.scrollY;
      // Sin scroll la que se ve es la primera. Sin esto, mientras carga (página
      // corta) se marcaba la última y se escondían los filtros de Inventario.
      if (desplazado <= 0) {
        setActiva(secciones[0]?.id);
        return;
      }
      const limite = (barra.current?.getBoundingClientRect().bottom ?? 0) + 48;
      let actual: string | undefined = secciones[0]?.id;
      for (const s of secciones) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= limite) actual = s.id;
      }
      // Al fondo de la página la última sección puede no llegar arriba: igual es la que se ve.
      if (contenedor && contenedor.scrollTop + contenedor.clientHeight >= contenedor.scrollHeight - 4) {
        actual = secciones.at(-1)?.id;
      }
      setActiva(actual);
    };
    const alScrollear = () => {
      if (!cuadro) cuadro = requestAnimationFrame(actualizar);
    };
    actualizar();
    const objetivo: HTMLElement | Window = contenedor ?? window;
    objetivo.addEventListener('scroll', alScrollear, { passive: true });
    return () => {
      objetivo.removeEventListener('scroll', alScrollear);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, [secciones]);

  return (
    <div ref={barra} className="sticky top-2 z-20 rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 p-1">
        <nav className="flex min-w-0 gap-1 overflow-x-auto" aria-label="Secciones">
          {secciones.map((s) => {
            const Icono = s.icono;
            const es = s.id === activa;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-current={es ? 'true' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  es ? 'bg-chrome text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {/* Sobre el fondo oscuro, un acento oscuro (el azul) no se veía. */}
                <Icono className="h-4 w-4" style={{ color: es ? (esOscuro(s.color) ? '#ffffff' : s.color) : undefined }} />
                {s.titulo}
              </a>
            );
          })}
        </nav>
        {extra && (!extraEn || extraEn.includes(activa ?? '')) && <div className="flex items-center gap-2 pr-1">{extra}</div>}
      </div>
      {debajo && <div className="border-t px-2 py-1.5">{debajo}</div>}
    </div>
  );
}

/**
 * Para lo que sale de las tablas de hechos, que se recalculan de madrugada:
 * sin esto, que no aparezcan las reservas de hoy parece un error.
 */
export function NotaHastaAnoche() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
      <MoonStar className="h-3 w-3" />
      datos hasta anoche
    </span>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { DEPARTAMENTO, MARCA, SERIE_CLARO, SERIE_OSCURO, contraste, tintaSobre } from '@/lib/design/paleta';

/**
 * La paleta entera, tal como la pinta el navegador.
 *
 * Los valores no se escriben acá: se resuelven en tiempo de render leyendo el
 * CSS ya aplicado, así que la tabla no puede desincronizarse del tema. Si
 * alguien cambia un token en index.css, esta pantalla lo muestra sin que haya
 * que tocar nada.
 *
 * El contraste va al lado de cada par que lleva texto encima, medido y no
 * supuesto: es lo que evita repetir el error de poner blanco sobre el verde de
 * marca, que da 2,28:1.
 */

/* Los dos siguientes llevan nombre en inglés a propósito: React exige que un
   hook empiece con `use` para poder verificar sus reglas, y el linter lo
   comprueba. Es convención del framework, no prosa. */

/** Resuelve cualquier notación de color —oklch, var(), rgb— a hex. */
function useResolutor() {
  const cx = useRef<CanvasRenderingContext2D | null>(null);
  if (!cx.current && typeof document !== 'undefined') {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    cx.current = cv.getContext('2d', { willReadFrequently: true });
  }
  /**
   * `debajo` importa: varios tokens son blanco o negro translúcido —el borde
   * en oscuro es `oklch(1 0 0 / 11%)`— y leídos sobre nada darían blanco puro.
   * Se componen sobre la superficie donde de verdad se apoyan.
   */
  return (color: string, debajo = '#ffffff'): string => {
    const c = cx.current;
    if (!c) return '#000000';
    c.clearRect(0, 0, 1, 1);
    c.fillStyle = debajo;
    c.fillRect(0, 0, 1, 1);
    c.fillStyle = color;
    c.fillRect(0, 0, 1, 1);
    const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
    return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  };
}

/** Lee el valor vigente de una variable CSS en ese punto del árbol. */
function useTokens(vars: string[]) {
  const ancla = useRef<HTMLDivElement>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const resolver = useResolutor();

  useEffect(() => {
    const el = ancla.current;
    if (!el) return;
    const sonda = document.createElement('div');
    el.appendChild(sonda);
    // la tarjeta es la superficie sobre la que se apoya casi todo
    sonda.style.backgroundColor = 'var(--card)';
    const tarjeta = resolver(getComputedStyle(sonda).backgroundColor);
    const out: Record<string, string> = {};
    for (const v of vars) {
      sonda.style.backgroundColor = `var(${v})`;
      out[v] = resolver(getComputedStyle(sonda).backgroundColor, tarjeta);
    }
    sonda.remove();
    setValores(out);
    // `vars` es una constante de módulo en todos los usos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ancla, valores] as const;
}

function Ficha({ fondo, texto, nombre, detalle }: Readonly<{
  fondo: string; texto?: string; nombre: string; detalle?: string;
}>) {
  const ratio = texto ? contraste(fondo, texto) : null;
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-border">
      {/* Sin `texto`, la etiqueta va en la tinta que gana el contraste: el
          nombre de un color tiene que poder leerse. El número de abajo sigue
          midiendo el par que la ficha viene a mostrar. */}
      <div className="px-2.5 py-3" style={{ backgroundColor: fondo, color: texto ?? tintaSobre(fondo) }}>
        <div className="truncate text-2xs font-semibold">{nombre}</div>
        <div className="font-mono text-2xs opacity-75">{fondo.toUpperCase()}</div>
      </div>
      <div className="bg-card px-2.5 py-1">
        {ratio !== null && (
          <span className="font-mono text-2xs text-muted-foreground">
            {ratio.toFixed(2)}:1
            <span className={ratio >= 4.5 ? ' text-success-texto' : ratio >= 3 ? ' text-warning-texto' : ' text-danger-texto'}>
              {ratio >= 4.5 ? ' AA' : ratio >= 3 ? ' AA-grande' : ' bajo'}
            </span>
          </span>
        )}
        {detalle && <div className="truncate text-2xs text-muted-foreground">{detalle}</div>}
      </div>
    </div>
  );
}

function Grupo({ titulo, nota, children }: Readonly<{ titulo: string; nota?: string; children: ReactNode }>) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="mb-2 text-2xs leading-snug text-muted-foreground">{nota}</p>}
      <div className={nota ? '' : 'mt-2'}>{children}</div>
    </div>
  );
}

const ROLES = ['info', 'success', 'warning', 'danger', 'acento'] as const;
const PIEZAS = ['suave', 'borde', '', 'texto'] as const;

const VARS_ROL = ROLES.flatMap((r) => [
  `--${r}`, `--${r}-foreground`, `--${r}-suave`, `--${r}-borde`, `--${r}-texto`,
]);

const VARS_SUPERFICIE = [
  '--background', '--card', '--popover', '--muted', '--secondary', '--accent',
  '--border', '--input', '--chrome', '--sidebar', '--sidebar-accent',
];

const VARS_ACCION = [
  '--primary', '--primary-foreground', '--destructive', '--destructive-foreground',
  '--ring', '--foreground', '--muted-foreground', '--chrome-foreground',
  '--secondary-foreground', '--accent-foreground', '--sidebar-foreground',
];

const TODAS = [...VARS_ROL, ...VARS_SUPERFICIE, ...VARS_ACCION];

const NOMBRE_ROL: Record<string, string> = {
  info: 'Información', success: 'Bien', warning: 'Atención', danger: 'Problema', acento: 'Acento',
};

/** Todo lo que el tema define, resuelto en vivo. */
export function Paleta() {
  const [ancla, t] = useTokens(TODAS);

  return (
    <div ref={ancla}>
      <Grupo
        titulo="Marca"
        nota="Hex exactos del manual 2.1 (A.4). Cinco nombran un departamento; el cian es el centro del isotipo. No dependen del tema."
      >
        <div className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @6xl:grid-cols-6">
          <Ficha fondo={MARCA.cian} texto={MARCA.tinta} nombre="Cian" detalle="principal del sistema" />
          {Object.entries(DEPARTAMENTO).map(([k, d]) => (
            <Ficha
              key={k}
              fondo={d.color}
              texto={contraste(d.color, '#ffffff') >= contraste(d.color, MARCA.tinta) ? '#ffffff' : MARCA.tinta}
              nombre={d.nombre.split(' ')[0]}
              detalle={d.nombre}
            />
          ))}
          <Ficha fondo={MARCA.oscuro} texto="#ffffff" nombre="Oscuro" detalle="bandas y barra lateral" />
          <Ficha fondo={MARCA.tinta} texto="#ffffff" nombre="Tinta" detalle="texto" />
        </div>
      </Grupo>

      <Grupo
        titulo="Roles"
        nota="Cinco estados, cuatro piezas cada uno: fondo tenue, su borde, el relleno macizo y el texto. El relleno no cambia con el tema; las otras tres sí."
      >
        <div className="space-y-1.5">
          {ROLES.map((rol) => (
            <div key={rol} className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @6xl:grid-cols-6">
              {PIEZAS.map((pieza) => {
                const v = pieza ? `--${rol}-${pieza}` : `--${rol}`;
                const fondo = t[v];
                if (!fondo) return <div key={v} className="h-[70px] rounded-md bg-muted" />;
                const texto = pieza === 'suave' ? t[`--${rol}-texto`]
                  : pieza === '' ? t[`--${rol}-foreground`]
                  : undefined;
                return (
                  <Ficha
                    key={v}
                    fondo={fondo}
                    texto={texto}
                    nombre={pieza ? `${NOMBRE_ROL[rol]} · ${pieza}` : `${NOMBRE_ROL[rol]} · relleno`}
                    detalle={v}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Superficies" nota="De la más honda a la más alta. Cada una tiene que separarse de la de al lado.">
        <div className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @4xl:grid-cols-6 @7xl:grid-cols-8">
          {VARS_SUPERFICIE.map((v) => (
            <Ficha key={v} fondo={t[v] ?? '#000000'} nombre={v.replace('--', '')} detalle={v} />
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Acción y texto" nota="Con el contraste del par que forman.">
        <div className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @6xl:grid-cols-6">
          <Ficha fondo={t['--primary'] ?? '#000'} texto={t['--primary-foreground']} nombre="Acción" detalle="--primary" />
          <Ficha fondo={t['--destructive'] ?? '#000'} texto={t['--destructive-foreground']} nombre="Destructivo" detalle="--destructive" />
          <Ficha fondo={t['--chrome'] ?? '#000'} texto={t['--chrome-foreground']} nombre="Banda" detalle="--chrome" />
          <Ficha fondo={t['--sidebar'] ?? '#000'} texto={t['--sidebar-foreground']} nombre="Barra lateral" detalle="--sidebar" />
          <Ficha fondo={t['--card'] ?? '#000'} texto={t['--foreground']} nombre="Texto en tarjeta" detalle="--foreground" />
          <Ficha fondo={t['--card'] ?? '#000'} texto={t['--muted-foreground']} nombre="Texto apagado" detalle="--muted-foreground" />
          <Ficha fondo={t['--secondary'] ?? '#000'} texto={t['--secondary-foreground']} nombre="Secundario" detalle="--secondary" />
          <Ficha fondo={t['--accent'] ?? '#000'} texto={t['--accent-foreground']} nombre="Acento (hover)" detalle="--accent" />
        </div>
      </Grupo>

      <Grupo
        titulo="Series de gráfico"
        nota="La marca llevada a la luz donde funciona sobre cada fondo. Son las únicas que cambian de hex entre temas."
      >
        <div className="space-y-1.5">
          {([['Sobre claro', SERIE_CLARO], ['Sobre oscuro', SERIE_OSCURO]] as const).map(([titulo, serie]) => (
            <div key={titulo}>
              <p className="mb-1 text-2xs uppercase tracking-wider text-muted-foreground">{titulo}</p>
              <div className="grid grid-cols-3 gap-1.5 @md:grid-cols-6">
                {Object.entries(serie).map(([k, v]) => (
                  <Ficha key={k} fondo={v} nombre={k} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Elevación" nota="Teñida con la tinta en claro; en oscuro con más opacidad y un filo claro arriba.">
        <div className="flex flex-wrap items-end gap-3">
          {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((n) => (
            <div key={n} className="text-center">
              <div className="size-12 rounded-lg bg-card" style={{ boxShadow: `var(--shadow-${n})` }} />
              <div className="mt-1 text-2xs text-muted-foreground">{n}</div>
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Radio" nota="Cuanto más grande la superficie, más radio.">
        <div className="flex flex-wrap gap-3">
          {([['sm', 'rounded-sm', 'control'], ['md', 'rounded-md', 'botón'],
             ['lg', 'rounded-lg', 'tarjeta'], ['xl', 'rounded-xl', 'panel']] as const).map(([n, clase, uso]) => (
            <div key={n} className="text-center">
              <div className={`size-12 border border-border bg-card ${clase}`} />
              <div className="mt-1 text-2xs text-muted-foreground">{n} · {uso}</div>
            </div>
          ))}
        </div>
      </Grupo>
    </div>
  );
}

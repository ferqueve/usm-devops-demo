/**
 * Fuente única de los colores de la app.
 *
 * Antes había cuatro archivos definiendo la paleta por su cuenta
 * (`statistics/graficos/tema.ts`, `predicciones/colores.ts`,
 * `common/dataviz.tsx` y el `UTEC` de `views/_components/Graficos.tsx`), y no
 * coincidían: cuatro azules, cuatro verdes, tres naranjas. Uno de ellos tenía
 * directamente el naranja equivocado. Por eso el mismo "verde" no era el mismo
 * verde entre el dashboard y estadísticas.
 *
 * Acá viven los hex exactos del Manual de Identidad Visual UTEC 2.1 (A.4), y
 * todo lo demás se deriva de ellos por cálculo, no a mano. Si mañana cambia un
 * color de marca, se cambia en un solo lugar y baja a toda la app.
 *
 * El manual está en `documentation/marca/`.
 */

/* ------------------------------------------------------------------ *
 * Conversión de color
 *
 * Se trabaja en OKLCH porque es perceptualmente uniforme: bajarle la
 * luminosidad a un color conserva su tono, cosa que en HSL no pasa (el
 * amarillo se ensucia hacia verde). Es lo que permite derivar las variantes
 * de gráfico desde la marca sin que dejen de parecer el mismo color.
 * ------------------------------------------------------------------ */

type Oklch = { L: number; C: number; H: number };

const aLineal = (c: number) => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

const aGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const raizCubica = (x: number) => (x < 0 ? -((-x) ** (1 / 3)) : x ** (1 / 3));

function hexAOklch(hex: string): Oklch {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => aLineal(parseInt(h.slice(i, i + 2), 16)));

  const l = raizCubica(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = raizCubica(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = raizCubica(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    L,
    C: Math.hypot(a, bb),
    H: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklchARgb({ L, C, H }: Oklch): [number, number, number] {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Baja el croma hasta que el color entre en sRGB, y devuelve el hex. */
function oklchAHex(color: Oklch): string {
  for (let i = 0; i < 64; i++) {
    const rgb = oklchARgb({ ...color, C: color.C * (1 - i / 64) });
    if (rgb.every((v) => v >= -0.001 && v <= 1.001)) {
      return `#${rgb
        .map((v) => Math.max(0, Math.min(255, Math.round(aGamma(v) * 255)))
          .toString(16)
          .padStart(2, '0'))
        .join('')}`;
    }
  }
  return '#000000';
}

/**
 * Mismo color, otra luminosidad.
 *
 * `L` va de 0 (negro) a 1 (blanco). Sobre fondo claro los gráficos piden
 * alrededor de 0.55; sobre fondo oscuro, alrededor de 0.70.
 */
export function conLuz(hex: string, L: number): string {
  return oklchAHex({ ...hexAOklch(hex), L });
}

/** Mezcla dos hex. Sólido: sobre el fondo de un svg un rgba se ensucia. */
export function mezclar(desde: string, hasta: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) =>
    Math.round(canal(desde, i) + (canal(hasta, i) - canal(desde, i)) * k)
  );
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/* ------------------------------------------------------------------ *
 * Marca
 * ------------------------------------------------------------------ */

/**
 * Colores institucionales, valor exacto del manual (A.4).
 *
 * El cian es el color principal del sistema de identidad. El hex es el que usa
 * utec.edu.uy; el manual impreso especifica #00A9E0 y los dos conviven.
 */
export const MARCA = {
  cian: '#00c7ff',
  azul: '#184897',
  verde: '#86bb4c',
  amarillo: '#F6CA21',
  naranja: '#DE7A27',
  rojo: '#DF2B31',
  oscuro: '#343a40',
  tinta: '#212529',
} as const;

/**
 * Qué departamento nombra cada color (A.4). Son las aspas del isotipo.
 *
 * Usar esto cuando el dato habla de una carrera, materia o evento: ahí el
 * color es información. En una métrica de operación no lo es.
 */
export const DEPARTAMENTO = {
  ti: { color: MARCA.azul, nombre: 'Tecnologías de la Información' },
  sostenibilidad: { color: MARCA.verde, nombre: 'Sostenibilidad Ambiental' },
  innovacion: { color: MARCA.amarillo, nombre: 'Innovación y Emprendimientos' },
  alimentos: { color: MARCA.naranja, nombre: 'Alimentos' },
  mecatronica: { color: MARCA.rojo, nombre: 'Mecatrónica, Logística y Biomédica' },
} as const;

/* ------------------------------------------------------------------ *
 * Gráficos
 *
 * Los colores de marca a plena saturación son duros en una línea fina o un
 * área chica sobre blanco, así que las series usan variantes más oscuras. Lo
 * importante es que salen del mismo tono: son el color de la marca con otra
 * luz, no otro color.
 * ------------------------------------------------------------------ */

/**
 * Luminosidad de cada serie, por tono y por fondo.
 *
 * No es un valor único para todos: los colores cálidos no toleran la misma
 * bajada que los fríos. Con un L parejo de 0.55 el amarillo se vuelve oliva y
 * el naranja marrón —deja de ser el color de la marca—, mientras que el azul,
 * que ya nace oscuro, casi no se mueve. Cada uno va a la luz donde todavía se
 * reconoce y a la vez separa del fondo.
 */
type Tono = 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'cian';
type Luz = Record<Tono, number>;

const LUZ: { claro: Luz; oscuro: Luz } = {
  claro: { azul: 0.46, verde: 0.6, amarillo: 0.7, naranja: 0.6, rojo: 0.55, cian: 0.58 },
  oscuro: { azul: 0.7, verde: 0.75, amarillo: 0.82, naranja: 0.72, rojo: 0.68, cian: 0.74 },
};

/** Una serie completa de gráfico: un hex por tono. */
export type Serie = Record<Tono, string>;

function serie(luz: Luz): Serie {
  return {
    azul: conLuz(MARCA.azul, luz.azul),
    verde: conLuz(MARCA.verde, luz.verde),
    amarillo: conLuz(MARCA.amarillo, luz.amarillo),
    naranja: conLuz(MARCA.naranja, luz.naranja),
    rojo: conLuz(MARCA.rojo, luz.rojo),
    cian: conLuz(MARCA.cian, luz.cian),
  };
}

export const SERIE_CLARO: Serie = serie(LUZ.claro);
export const SERIE_OSCURO: Serie = serie(LUZ.oscuro);

/**
 * Orden de las categorías en un gráfico.
 *
 * Fijo a propósito: un color sigue a su categoría, no a su posición, para que
 * la misma serie se vea igual en dos pantallas distintas.
 */
export const ORDEN_CATEGORIAS: readonly Tono[] = [
  'azul', 'verde', 'naranja', 'cian', 'rojo', 'amarillo',
];

/** Neutros de gráfico: grilla, ejes, huecos. Son los grises del sitio UTEC. */
export interface Neutro {
  grilla: string;
  eje: string;
  vacio: string;
  superficie: string;
  texto: string;
  apagado: string;
}

export const NEUTRO: { claro: Neutro; oscuro: Neutro } = {
  claro: {
    grilla: '#e9ecef',
    eje: '#6c757d',
    vacio: '#f1f3f5',
    superficie: '#ffffff',
    texto: '#212529',
    apagado: '#adb5bd',
  },
  oscuro: {
    grilla: '#343a40',
    eje: '#adb5bd',
    vacio: '#2b3035',
    superficie: '#212529',
    texto: '#e9ecef',
    apagado: '#6c757d',
  },
};

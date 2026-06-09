/**
 * Paleta del sistema de diseño, traducida desde el frontend web.
 *
 * Origen: `frontend/src/index.css`. El web define los tokens shadcn en OKLCH
 * (escala de grises neutra, chroma 0) y la paleta corporativa UTEC en hex.
 * React Native no soporta oklch(), así que acá los tokens shadcn están
 * convertidos a su equivalente hex de la escala `neutral` de Tailwind, que es
 * exactamente lo que esos valores OKLCH representan.
 *
 * Por ahora solo modo claro. La estructura queda lista para sumar un objeto
 * `dark` paralelo más adelante (el web tiene un bloque `.dark`).
 */

/** Colores institucionales UTEC (hex exactos del web). */
export const utec = {
  green: '#86BB4C',
  yellow: '#F6CA21',
  orange: '#DE7A27',
  red: '#DF2B31',
  blue: '#184897', // primario corporativo
  cyan: '#00C7FF',
  purple: '#9333EA',
  dark: '#343A40', // sidebar / header
  darkLighter: '#4A5057', // hover sidebar
  darkSubtle: '#3A4046',
} as const;

/** Tokens shadcn (modo claro) — equivalentes hex de los OKLCH del web. */
export const light = {
  background: '#FFFFFF', // oklch(1 0 0)
  foreground: '#0A0A0A', // oklch(0.145 0 0)
  card: '#FFFFFF',
  cardForeground: '#0A0A0A',
  popover: '#FFFFFF',
  popoverForeground: '#0A0A0A',
  primary: '#171717', // oklch(0.205 0 0) — neutral-900 (botón principal "casi negro")
  primaryForeground: '#FAFAFA', // oklch(0.985 0 0)
  secondary: '#F5F5F5', // oklch(0.97 0 0) — neutral-100
  secondaryForeground: '#171717',
  muted: '#F5F5F5',
  mutedForeground: '#737373', // oklch(0.556 0 0) — neutral-500
  accent: '#F5F5F5',
  accentForeground: '#171717',
  destructive: '#DC2626', // oklch(0.577 0.245 27.325) — rojo
  destructiveForeground: '#FAFAFA',
  border: '#E5E5E5', // oklch(0.922 0 0) — neutral-200
  input: '#E5E5E5',
  ring: '#A3A3A3', // oklch(0.708 0 0) — neutral-400

  /** Chrome del sidebar/drawer (de las utilidades `.sidebar-*` del web). */
  sidebar: utec.dark,
  sidebarHover: utec.darkLighter,
  sidebarItem: '#D1D5DB', // gray-300 — texto de ítem inactivo
  sidebarItemActiveBg: '#FFFFFF',
  sidebarItemActiveText: '#171717',
} as const;

/** Tokens shadcn (modo oscuro) — equivalentes del bloque `.dark` del web. */
export const dark: Colors = {
  background: '#0A0A0A', // oklch(0.145)
  foreground: '#FAFAFA', // oklch(0.985)
  card: '#171717', // oklch(0.205) — neutral-900
  cardForeground: '#FAFAFA',
  popover: '#171717',
  popoverForeground: '#FAFAFA',
  primary: '#FAFAFA', // en dark el primario es claro (botón claro, texto oscuro)
  primaryForeground: '#171717',
  secondary: '#262626', // neutral-800
  secondaryForeground: '#FAFAFA',
  muted: '#262626',
  mutedForeground: '#A1A1A1', // oklch(0.708) — neutral-400
  accent: '#262626',
  accentForeground: '#FAFAFA',
  destructive: '#EF4444', // rojo más brillante para fondo oscuro
  destructiveForeground: '#FAFAFA',
  border: 'rgba(255,255,255,0.12)',
  input: 'rgba(255,255,255,0.16)',
  ring: '#737373',

  // El sidebar es un elemento de marca oscuro en ambos modos.
  sidebar: utec.dark,
  sidebarHover: utec.darkLighter,
  sidebarItem: '#D1D5DB',
  sidebarItemActiveBg: '#FFFFFF',
  sidebarItemActiveText: '#171717',
};

/**
 * Mapeo de estados de dominio a color UTEC.
 * Usado por badges de estado de espacios, reservas e inventario.
 */
export const statusColor = {
  // Espacios
  DISPONIBLE: utec.green,
  MANTENIMIENTO: utec.orange,
  NO_DISPONIBLE: utec.red,
  // Reservas
  APROBADO: utec.green,
  PENDIENTE: utec.yellow,
  CANCELADO: utec.red,
  RECHAZADO: utec.red,
  ENTREGADO: utec.blue,
  // Inventario
  DANADO: utec.red,
} as const;

export type StatusKey = keyof typeof statusColor;

export type Colors = Record<keyof typeof light, string>;

/**
 * Paleta activa (mutable). El ThemeProvider la cambia al alternar el tema.
 * `colors` es un Proxy en vivo: cada acceso lee la paleta activa, así los
 * estilos creados con `themed()` reflejan el tema actual en cada render.
 */
let active: Colors = light;

export function setActivePalette(mode: 'light' | 'dark'): void {
  active = mode === 'dark' ? dark : light;
}

export const colors: Colors = new Proxy({} as Colors, {
  get: (_t, prop: string) => (active as Record<string, string>)[prop],
}) as Colors;

/**
 * Envuelve `StyleSheet.create(...)` para que siga el tema activo.
 * Uso: `const styles = themed((colors) => StyleSheet.create({ ... }));`
 * El resultado es un Proxy que reconstruye los estilos cuando cambia la paleta
 * (memoizado por paleta para no recrearlos en cada acceso).
 */
export function themed<T extends object>(factory: (c: Colors) => T): T {
  let cacheKey: Colors | null = null;
  let cached: T;
  return new Proxy({} as T, {
    get: (_t, prop: string | symbol) => {
      if (cacheKey !== active) {
        cached = factory(active);
        cacheKey = active;
      }
      return (cached as Record<string | symbol, unknown>)[prop];
    },
  }) as T;
}

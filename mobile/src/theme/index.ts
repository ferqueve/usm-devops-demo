/**
 * Sistema de diseño mobile — tokens centrales.
 * Traducido desde `frontend/src/index.css` (Tailwind v4 + shadcn new-york).
 */
import { Platform } from 'react-native';
import { colors, utec } from './colors';

export { colors, light, dark, utec, statusColor, themed, setActivePalette } from './colors';
export type { Colors, StatusKey } from './colors';
export { ThemeProvider, useTheme, useColors, type ThemeMode } from './ThemeProvider';
export { makeStyles } from './makeStyles';

/**
 * Familias tipográficas.
 * El web usa Gilroy + Poppins para el cuerpo y una fuente corporativa "UTEC"
 * (mayúsculas, tracking) para títulos de marca. Gilroy no es libre, así que en
 * mobile el cuerpo usa Poppins (cargada vía @expo-google-fonts/poppins) y los
 * títulos de marca usan la misma `utec_gruesa_3.0.ttf` del web (assets/fonts/UTEC.ttf).
 */
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  utec: 'UTEC',
} as const;

/**
 * Escala tipográfica. El web reduce la base a 14px (html { font-size: 87.5% }).
 * Replicamos esa jerarquía compacta.
 */
export const fontSize = {
  xs: 11, // text-xs ~0.75rem
  sm: 12, // text-sm
  base: 14, // base del web
  md: 15,
  lg: 16, // h5
  xl: 18, // h4
  '2xl': 20, // h3
  '3xl': 24, // h2
  '4xl': 28, // h1
} as const;

/** Espaciado base de 4px (escala de Tailwind). */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Radios. Base shadcn `--radius: 0.625rem` (10px). */
export const radius = {
  sm: 6, // rounded-md (botones)
  md: 10, // --radius
  lg: 12, // rounded-xl (cards)
  xl: 16,
  full: 9999,
} as const;

/**
 * Sombras. El web usa `.shadow-card` y `shadow-xs/sm` de Tailwind.
 * Acá como objetos de estilo RN (elevation en Android, shadow* en iOS).
 */
export const shadow = {
  xs:
    Platform.OS === 'android'
      ? { elevation: 1 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        },
  card:
    Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
  lg:
    Platform.OS === 'android'
      ? { elevation: 6 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
} as const;

/** Gradiente corporativo UTEC (de `.animate-utec-rotating-gradient`). */
export const utecGradient = [
  utec.green,
  utec.yellow,
  utec.orange,
  utec.red,
  utec.blue,
] as const;

export const theme = {
  colors,
  utec,
  fonts,
  fontSize,
  spacing,
  radius,
  shadow,
} as const;

export type Theme = typeof theme;

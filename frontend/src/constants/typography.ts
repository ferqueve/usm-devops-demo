// Tipografía UTEC
// Regla: UTEC txt Black para titulares, UTEC txt Heavy para subtítulos, UTEC txt Regular para textos.
// Para digital: usar Gilroy como preferida. Alternativa: Poppins (Google Fonts).
// Tipografía eventual: uso MAYÚSCULAS en frases cortas con protagonismo.

export const UTEC_TYPOGRAPHY = {
  // Familias de fuentes
  FONTS: {
    PRIMARY: 'Gilroy, sans-serif',
    ALTERNATIVE: 'Poppins, sans-serif',
    FALLBACK: 'system-ui, -apple-system, sans-serif',
  },
  
  // Pesos de fuente
  WEIGHTS: {
    TITLES: 'font-black',      // UTEC txt Black para titulares
    SUBTITLES: 'font-extrabold', // UTEC txt Heavy para subtítulos
    BODY: 'font-normal',       // UTEC txt Regular para textos
    LIGHT: 'font-light',       // Para texto eventual
  },
  
  // Tamaños de fuente
  SIZES: {
    TITLE: 'text-3xl',         // Para titulares principales
    SUBTITLE: 'text-xl',       // Para subtítulos
    BODY: 'text-base',         // Para texto del cuerpo
    SMALL: 'text-sm',          // Para texto pequeño
  },
  
  // Estilos especiales
  DISPLAY: {
    UPPERCASE: 'uppercase',    // MAYÚSCULAS para frases cortas con protagonismo
    TRACKING: 'tracking-wider', // Espaciado entre letras
  },
} as const;

// Clases de Tailwind predefinidas para tipografía UTEC
export const TYPOGRAPHY_CLASSES = {
  TITLE: `${UTEC_TYPOGRAPHY.WEIGHTS.TITLES} ${UTEC_TYPOGRAPHY.SIZES.TITLE}`,
  SUBTITLE: `${UTEC_TYPOGRAPHY.WEIGHTS.SUBTITLES} ${UTEC_TYPOGRAPHY.SIZES.SUBTITLE}`,
  BODY: `${UTEC_TYPOGRAPHY.WEIGHTS.BODY} ${UTEC_TYPOGRAPHY.SIZES.BODY}`,
  DISPLAY: `${UTEC_TYPOGRAPHY.WEIGHTS.LIGHT} ${UTEC_TYPOGRAPHY.DISPLAY.UPPERCASE} ${UTEC_TYPOGRAPHY.DISPLAY.TRACKING}`,
} as const;

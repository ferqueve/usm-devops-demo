// Reglas de branding y logo UTEC
// Regla: Priorizar versión vertical. Mantener área de protección.
// Tamaños mínimos: 1.2×1.8 cm (vertical) y 1.4 cm (horizontal).
// Fondos claros → logo cian/negro. Fondos oscuros → logo blanco.
// Prohibido alterar tipografía, colores o composición.

export const UTEC_BRANDING = {
  // Versiones del logo
  LOGO_VERSIONS: {
    PRIMARY: 'vertical',    // Versión vertical como prioritaria
    SECONDARY: 'horizontal', // Versión horizontal como alternativa
  },
  
  // Tamaños mínimos (en centímetros)
  MIN_SIZES: {
    VERTICAL: {
      WIDTH: 1.2,
      HEIGHT: 1.8,
    },
    HORIZONTAL: {
      WIDTH: 1.4,
      HEIGHT: 1.4,
    },
  },
  
  // Área de protección
  PROTECTION_AREA: {
    RULE: 'Padding equivalente al ancho de la U',
    MINIMUM: '1x', // Múltiplo del ancho de la U
  },
  
  // Reglas de uso
  USAGE_RULES: {
    LIGHT_BACKGROUNDS: 'Logo en cian/negro',
    DARK_BACKGROUNDS: 'Logo en blanco',
    NO_ALTERATIONS: 'No alterar tipografía, colores o composición',
  },
  
  // Colores del logo según fondo
  LOGO_COLORS: {
    LIGHT_BG: ['#00A9E0', '#000000'], // Cian y negro
    DARK_BG: ['#FFFFFF'],             // Blanco
  },
} as const;

// Clases de Tailwind para branding
export const BRANDING_CLASSES = {
  LOGO_CONTAINER: 'flex items-center justify-center',
  LOGO_PROTECTION: 'p-4', // Área de protección mínima
  LOGO_RESPONSIVE: 'w-auto h-auto max-w-full max-h-full',
} as const;

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Provider de tema (next-themes) para toda la app.
 * Aplica la clase `dark`/`light` al elemento raíz, lo que hace flipear los
 * tokens shadcn definidos en `index.css` (`:root` y `.dark`).
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

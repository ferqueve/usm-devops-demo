import { useMemo } from 'react';
import { useColors } from './ThemeProvider';
import type { Colors } from './colors';

/**
 * Crea un hook de estilos temáticos. El factory recibe la paleta activa.
 * Uso:
 *   const useStyles = makeStyles((c) => StyleSheet.create({ box: { backgroundColor: c.card } }));
 *   // dentro del componente:
 *   const styles = useStyles();
 */
export function makeStyles<T>(factory: (c: Colors) => T): () => T {
  return function useStyles(): T {
    const colors = useColors();
    return useMemo(() => factory(colors), [colors]);
  };
}

import type { ReactNode } from 'react';
import { Loader2, RotateCw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Los tres estados en los que un bloque no tiene todavía qué mostrar.
 *
 * El que faltaba era el del error. El patrón que había era
 * `.catch(() => {})` seguido de `if (!datos) return null`: cuando la llamada
 * fallaba, el panel desaparecía de la pantalla. Quien lo miraba no veía un
 * error, veía que la sección de valoraciones no existía.
 *
 * Un bloque que no puede mostrar lo suyo tiene que decirlo y dejar
 * reintentar.
 */

interface Props {
  cargando: boolean;
  /** El mensaje del error, o null si salió bien. */
  error?: string | null;
  /** Terminó de cargar y no hay nada que mostrar. */
  vacio?: boolean;
  /** Qué decir cuando está vacío de verdad. */
  textoVacio?: string;
  /** Sin esto no aparece el botón de reintentar. */
  alReintentar?: () => void;
  children: ReactNode;
}

export function EstadoCarga({
  cargando,
  error,
  vacio = false,
  textoVacio = 'Nada para mostrar.',
  alReintentar,
  children,
}: Readonly<Props>) {
  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <TriangleAlert className="size-5 text-danger" aria-hidden />
        <p className="text-sm text-foreground">No se pudo cargar.</p>
        {/* El detalle va debajo y más chico: sirve para reportar el problema,
            pero no es lo que hay que leer primero. */}
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        {alReintentar && (
          <Button variant="outline" size="sm" onClick={alReintentar} className="mt-1">
            <RotateCw className="size-3.5" />
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (vacio) return <EmptyState variant="linea" title={textoVacio} />;

  return <>{children}</>;
}

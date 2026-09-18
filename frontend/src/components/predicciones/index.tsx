import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDown, Layers, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HEADER_ACTION_ICON, HEADER_PRIMARY, PageHeader } from '@/components/layouts/PageHeader';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { statsApi, type ModeloML } from '@/lib/api/stats';
import type { Entrenamiento } from './comunes';
import PrediccionesAcademico from './academico/PrediccionesAcademico';
import PrediccionesInventario from './inventario/PrediccionesInventario';
import PrediccionesReservas from './reservas/PrediccionesReservas';
import { MARCA } from '@/lib/design/paleta';

type Vista = 'reservas' | 'inventario' | 'academico';

const VISTAS: Record<Vista, { nombre: string; descripcion: string }> = {
  reservas: {
    nombre: 'reservas',
    descripcion: 'Reservas: cuánta demanda viene en los próximos 30 días, en el campus y por tipo de espacio.',
  },
  inventario: {
    nombre: 'inventario',
    descripcion: 'Inventario: si el equipamiento va a alcanzar para lo que se va a pedir.',
  },
  academico: {
    nombre: 'académico',
    descripcion: 'Académico: cuántos inscriptos van a ir a cada tutoría que viene.',
  },
};

/** El naranja es de Predicciones en las tres vistas: no copia los colores de Estadísticas. */
const ACENTO = MARCA.naranja;

const NOMBRE_MODELO: Record<string, string> = { reservas: 'Reservas', inventario: 'Inventario', academico: 'Académico' };

/** Lo que el ml-svc devolvió dice error, aunque la request haya sido 200. */
function falla(cuerpo: unknown): string | null {
  const b = cuerpo as Record<string, unknown> | undefined;
  if (!b) return null;
  if (b.status === 'error' || b.detail || b.error) return String(b.detalle ?? b.error ?? b.detail ?? 'error');
  return null;
}

/** Una línea con la métrica de validación de cada modelo, para el aviso de éxito. */
function metrica(modelo: ModeloML, cuerpo: Record<string, unknown>): string | undefined {
  if (modelo === 'academico') return cuerpo.auc != null ? `AUC en validación: ${Number(cuerpo.auc).toFixed(2)}` : undefined;
  return cuerpo.wape != null ? `Error en validación: ${Number(cuerpo.wape).toFixed(1)}%` : undefined;
}

/**
 * Reentrenar desde la barra. Devuelve un número que cambia cada vez que
 * termina bien: las vistas lo miran para volver a pedir sus datos.
 */
function useReentrenar() {
  const [reentrenando, setReentrenando] = useState<ModeloML | null>(null);
  const [version, setVersion] = useState(0);

  const reentrenar = useCallback(async (modelo: ModeloML) => {
    setReentrenando(modelo);
    try {
      const res = await statsApi.reentrenarModeloML(modelo);
      const cuerpo = (res.data ?? {}) as Record<string, unknown>;
      if (!res.success) {
        toast.error('No se pudo reentrenar', { description: res.error ?? undefined });
        return;
      }
      if (modelo === 'todo') {
        // /train/todo responde 200 aunque alguno falle: se cuenta cuál.
        const fallidos = (['reservas', 'inventario', 'academico'] as const).filter((m) => falla(cuerpo[m]) != null);
        if (fallidos.length === 3) {
          toast.error('No se pudo reentrenar ningún modelo', { description: falla(cuerpo.reservas) ?? undefined });
        } else if (fallidos.length > 0) {
          toast.warning('Se reentrenó en parte', {
            description: fallidos.map((m) => `${NOMBRE_MODELO[m]}: ${falla(cuerpo[m])}`).join(' · '),
          });
        } else {
          toast.success('Se reentrenaron los tres modelos');
        }
        if (fallidos.length < 3) setVersion((v) => v + 1);
        return;
      }
      const error = falla(cuerpo);
      if (error) {
        toast.error('No se pudo reentrenar', { description: error });
        return;
      }
      toast.success(`Modelo de ${NOMBRE_MODELO[modelo].toLowerCase()} reentrenado`, { description: metrica(modelo, cuerpo) });
      setVersion((v) => v + 1);
    } catch (error) {
      toast.error('No se pudo reentrenar', { description: error instanceof Error ? error.message : undefined });
    } finally {
      setReentrenando(null);
    }
  }, []);

  return { reentrenando, reentrenar, version, recargar: () => setVersion((v) => v + 1) };
}

/**
 * Predicciones: tres vistas, reservas, inventario y académico, elegidas desde
 * el menú lateral (?tab=). Cada una tiene su modelo, y
 * el botón de reentrenar reentrena el de la vista que se está mirando.
 */
export default function Predicciones() {
  const { hasRole, hasPermission } = useRolePermissions();
  const [searchParams] = useSearchParams();
  const esAdmin = hasRole('ADMIN');
  const { reentrenando, reentrenar, version, recargar } = useReentrenar();

  if (!hasPermission('estadisticas:ver_reservas')) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No tenés acceso a las predicciones.</p>
      </div>
    );
  }

  const pedida = searchParams.get('tab');
  const vista: Vista = pedida === 'inventario' || pedida === 'academico' ? pedida : 'reservas';
  const { nombre, descripcion } = VISTAS[vista];
  const ocupado = reentrenando != null;

  const entrenamiento: Entrenamiento = {
    esAdmin,
    reentrenando: reentrenando === vista || reentrenando === 'todo',
    entrenar: () => void reentrenar(vista),
  };

  return (
    <>
      <PageHeader
        title="Predicciones"
        description={descripcion}
        accentColor={ACENTO}
        actions={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={recargar} aria-label="Actualizar" className={HEADER_ACTION_ICON}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar</TooltipContent>
            </Tooltip>
            {esAdmin && (
              <div className="ml-1 flex items-center">
                <Button
                  size="sm"
                  onClick={() => void reentrenar(vista)}
                  disabled={ocupado}
                  className={`${HEADER_PRIMARY} ml-0 rounded-r-none`}
                  title={`Reentrenar el modelo de ${nombre}`}
                >
                  {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">{ocupado ? 'Reentrenando…' : 'Reentrenar'}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={ocupado}
                      aria-label="Más opciones de reentrenamiento"
                      className={`${HEADER_PRIMARY} ml-0 rounded-l-none border-l border-[#343a40]/15 px-1.5`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => void reentrenar(vista)}>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Reentrenar {nombre}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void reentrenar('todo')}>
                      <Layers className="mr-2 h-3.5 w-3.5" />
                      Reentrenar todo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        }
      />

      {vista === 'inventario' ? (
        <PrediccionesInventario version={version} entrenamiento={entrenamiento} />
      ) : vista === 'academico' ? (
        <PrediccionesAcademico version={version} entrenamiento={entrenamiento} />
      ) : (
        <PrediccionesReservas version={version} entrenamiento={entrenamiento} />
      )}
    </>
  );
}

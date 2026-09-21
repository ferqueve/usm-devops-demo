import { useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Permission } from '@/lib/config/permissions';

/**
 * Confirmación de borrado, una sola vez.
 *
 * Había ocho copias de este diálogo —carrera, materia, evento, espacio, tipo
 * de espacio, tipo de elemento, item de inventario e inventario de un
 * espacio—, de 77 a 101 líneas cada una. Comparadas dos de ellas ignorando el
 * nombre de la entidad, diferían en dos renglones: el import del tipo y una
 * frase de la explicación. Eran unas 690 líneas para decir lo mismo.
 *
 * Lo que de verdad cambia entre un caso y otro es qué se borra, cómo se llama,
 * qué consecuencia tiene y quién puede hacerlo.
 */

/**
 * `el` o `la` para el nombre de la entidad.
 *
 * Las ocho entidades de hoy son regulares: termina en -a es femenino, y los
 * sufijos -ción, -sión, -dad, -tad, -tud también aunque terminen en consonante
 * ("la asignación"). Todo lo demás es masculino: el evento, el espacio, el
 * tipo de elemento, el item de inventario.
 *
 * Se mide sobre la primera palabra porque el núcleo va adelante: "tipo de
 * espacio" es masculino por `tipo`, no por `espacio`.
 */
function genero(entidad: string): 'el' | 'la' {
  const nucleo = entidad.split(' ')[0].toLowerCase();
  const femenino = nucleo.endsWith('a') || /(ción|sión|dad|tad|tud)$/.test(nucleo);
  return femenino ? 'la' : 'el';
}

interface Props<T> {
  /** El registro a borrar. Con `null` el diálogo no se monta. */
  item: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama después de borrar bien, para que la pantalla se refresque. */
  onSuccess: () => void;

  /** Cómo se llama el tipo de cosa, en singular y minúscula: "carrera". */
  entidad: string;
  /** El nombre del registro concreto, para que se vea qué se está por borrar. */
  nombre: (item: T) => string;
  /** La llamada que lo borra. */
  eliminar: (item: T) => Promise<unknown>;

  /**
   * Qué le pasa al resto del sistema.
   *
   * Es el único texto que cambiaba de verdad entre las ocho copias, y es la
   * parte que importa: quien confirma tiene que saber si esto se puede
   * deshacer y qué queda colgando.
   */
  consecuencia?: ReactNode;

  /**
   * Datos extra cuando el nombre no alcanza para saber cuál de varios es.
   * Dos asignaciones de inventario del mismo tipo sólo se distinguen por la
   * cantidad.
   */
  detalle?: (item: T) => { etiqueta: string; valor: ReactNode }[];

  /**
   * Sin este permiso no aparece el botón de eliminar.
   *
   * Tres de los ocho diálogos lo tenían y cinco no. Se respeta lo que cada uno
   * hacía; unificarlo es una decisión de producto, no de este componente.
   */
  permiso?: Permission;
}

export function ConfirmarBorradoDialog<T>({
  item,
  open,
  onOpenChange,
  onSuccess,
  entidad,
  nombre,
  eliminar,
  consecuencia,
  detalle,
  permiso,
}: Readonly<Props<T>>) {
  const [borrando, setBorrando] = useState(false);
  const art = genero(entidad);

  if (!item) return null;

  const campos = detalle?.(item) ?? [];

  const confirmar = async () => {
    try {
      setBorrando(true);
      await eliminar(item);
      toast.success(
        `${entidad[0].toUpperCase()}${entidad.slice(1)} eliminad${art === 'la' ? 'a' : 'o'}`,
        { description: `${nombre(item)} ya no está disponible.` }
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(`No se pudo eliminar ${art} ${entidad}`, {
        description: error instanceof Error ? error.message : 'Intentalo de nuevo en un momento.',
      });
    } finally {
      setBorrando(false);
    }
  };

  const accion = (
    <AlertDialogAction
      onClick={confirmar}
      disabled={borrando}
      className="bg-danger text-danger-foreground hover:bg-danger/90"
    >
      {borrando && <Loader2 className="size-4 animate-spin" />}
      {borrando ? 'Eliminando…' : 'Eliminar'}
    </AlertDialogAction>
  );

  return (
    <AlertDialog
      open={open}
      // Mientras borra no se puede cerrar: la llamada ya salió y cerrar dejaría
      // la pantalla sin saber cómo terminó.
      onOpenChange={(v) => (borrando ? undefined : onOpenChange(v))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-danger" />
            Eliminar {entidad}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                ¿Seguro que querés eliminar {art} {entidad}{' '}
                <strong className="text-foreground">{nombre(item)}</strong>?
              </p>
              {campos.length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-l-2 border-danger-borde pl-3 text-sm">
                  {campos.map(({ etiqueta, valor }) => (
                    <div key={etiqueta} className="contents">
                      <dt className="text-muted-foreground">{etiqueta}</dt>
                      <dd className="text-foreground">{valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {consecuencia && <p>{consecuencia}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={borrando}>Cancelar</AlertDialogCancel>
          {/*
            El guard se monta sólo si hay permiso que chequear: por dentro
            llama a `useAuth`, y montarlo siempre ataría los cinco diálogos sin
            permiso a que exista un AuthProvider arriba.
          */}
          {permiso ? (
            <PermissionGuard requiredPermission={permiso}>{accion}</PermissionGuard>
          ) : (
            accion
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

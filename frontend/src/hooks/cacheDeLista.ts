import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Una lista que se pide una vez y se comparte entre componentes.
 *
 * Había cuatro copias de esto —carreras, espacios, materias, tipos de
 * elemento—, de 124 a 150 líneas cada una. Comparadas dos ignorando el nombre
 * de la entidad, diferían en tres renglones: el import de la api, el minuto
 * del caché y una frase del comentario. Eran unas 520 líneas para decir lo
 * mismo.
 *
 * Lo que hace y no es obvio:
 *
 * - El caché vive en el módulo, no en el componente, así que diez pantallas
 *   que piden carreras hacen una sola llamada.
 * - `pendingRequest` es lo que evita la estampida: si tres componentes montan
 *   a la vez, el segundo y el tercero esperan a la petición del primero en
 *   lugar de largar la suya.
 * - `refresh()` relanza el error para quien lo llamó; la carga inicial no,
 *   porque nadie lo espera y quedaría como unhandled rejection. El error
 *   igual queda en el estado.
 */

/** 5 minutos. Lo que se edita seguido: espacios, materias. */
export const CACHE_CORTO = 5 * 60 * 1000;
/** 10 minutos. Lo que casi no cambia: carreras, tipos de elemento. */
export const CACHE_LARGO = 10 * 60 * 1000;

interface Opciones<T> {
  /** Cómo se pide la lista. */
  pedir: () => Promise<{ data?: T[] | null }>;
  /** En plural y minúscula, para el mensaje de error: "las carreras". */
  nombre: string;
  duracion?: number;
}

export interface ListaCacheada<T> {
  datos: T[];
  loading: boolean;
  error: Error | null;
  /** Vacía el caché y vuelve a pedir. */
  refresh: () => Promise<T[]>;
  /** Vacía el caché sin pedir, para después de crear o borrar algo. */
  invalidar: () => void;
}

export function crearCacheDeLista<T>({ pedir, nombre, duracion = CACHE_CORTO }: Opciones<T>) {
  let cache: T[] | null = null;
  let sello = 0;
  let enCurso: Promise<T[]> | null = null;

  const invalidar = () => {
    cache = null;
    sello = 0;
  };

  // En inglés porque la regla `react-hooks/rules-of-hooks` de eslint mira el
  // nombre: si no empieza con `use`, no lo reconoce como hook y se queja de
  // cada useState de adentro.
  function useLista(): ListaCacheada<T> {
    const [datos, setDatos] = useState<T[]>(cache ?? []);
    const [loading, setLoading] = useState<boolean>(!cache);
    const [error, setError] = useState<Error | null>(null);

    const traer = useCallback(async (forzar = false): Promise<T[]> => {
      if (!forzar && cache && Date.now() - sello < duracion) {
        setDatos(cache);
        setLoading(false);
        return cache;
      }

      if (enCurso) {
        try {
          const ya = await enCurso;
          setDatos(ya);
          setLoading(false);
          return ya;
        } catch (e) {
          setError(e as Error);
          setLoading(false);
          throw e;
        }
      }

      setLoading(true);
      setError(null);

      enCurso = (async () => {
        try {
          const respuesta = await pedir();
          if (!respuesta.data) throw new Error('No se recibieron datos');
          cache = respuesta.data;
          sello = Date.now();
          setDatos(respuesta.data);
          return respuesta.data;
        } catch (e) {
          const err = e as Error;
          setError(err);
          console.error(`Error al cargar ${nombre}:`, err);
          // Sólo molesta con un toast si alguien apretó actualizar: en la
          // carga inicial el estado de error ya lo cuenta en pantalla.
          if (forzar) toast.error(`Error al cargar ${nombre}`);
          throw err;
        } finally {
          setLoading(false);
          enCurso = null;
        }
      })();

      return enCurso;
    }, []);

    useEffect(() => {
      traer().catch(() => {});
    }, [traer]);

    const refresh = useCallback(async () => {
      invalidar();
      return traer(true);
    }, [traer]);

    return { datos, loading, error, refresh, invalidar };
  }

  return { useLista, invalidar };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse } from '@/lib/api/client';

/**
 * Carga de una vista de Predicciones. `version` cambia cuando se reentrena o
 * se pide actualizar: así la barra de arriba recarga la vista sin conocer sus
 * datos. Mientras recarga se siguen mostrando los datos anteriores.
 */
export function useDatosML<T>(pedir: () => Promise<ApiResponse<T>>, version: number, clave = '') {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  // El pedido cambia de identidad en cada render: se guarda el último para no reintentar en bucle.
  const pedido = useRef(pedir);
  pedido.current = pedir;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await pedido.current();
      if (res.success === false) throw new Error(res.error ?? 'error');
      setDatos(res.data ?? null);
      setError(false);
    } catch (e) {
      console.error('Error cargando predicciones', e);
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, version, clave]);

  return { datos, cargando, error };
}

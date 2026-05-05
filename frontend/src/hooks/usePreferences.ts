import { useState, useEffect } from 'react';
import { preferencesApi, type PreferenciasVista } from '@/lib/api/preferences';

interface UsePreferencesReturn {
  preferencias: PreferenciasVista | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para cargar y usar las preferencias de vista del usuario
 */
export function usePreferences(): UsePreferencesReturn {
  const [preferencias, setPreferencias] = useState<PreferenciasVista | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const response = await preferencesApi.obtenerPreferencias();
        const data = (response.data || response) as { preferencias: { vista?: PreferenciasVista } };
        
        if (data?.preferencias?.vista) {
          setPreferencias(data.preferencias.vista);
        } else {
          // Si no hay preferencias, usar valores por defecto
          setPreferencias({
            reservasViewMode: 'calendar',
            reservasCalendarViewMode: 'week',
            reservasPageSize: 10,
            espaciosViewMode: 'cards',
            espaciosPageSize: 12,
            inventarioViewMode: 'table',
            inventarioPageSize: 25,
            usuariosPageSize: 10,
            auditoriaPageSize: 20,
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error al cargar preferencias:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar preferencias');
        // En caso de error, usar valores por defecto
        setPreferencias({
          reservasViewMode: 'calendar',
          reservasCalendarViewMode: 'week',
          reservasPageSize: 10,
          espaciosViewMode: 'cards',
          espaciosPageSize: 12,
          inventarioViewMode: 'table',
          inventarioPageSize: 25,
          usuariosPageSize: 10,
          auditoriaPageSize: 20,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  return { preferencias, loading, error };
}


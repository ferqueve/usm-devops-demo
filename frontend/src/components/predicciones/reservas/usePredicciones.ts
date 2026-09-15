import { useMemo } from 'react';
import { statsApi, type CalidadModelo, type ForecastDemanda, type TiposEspacioML } from '@/lib/api/stats';
import { diaSemana } from '../formato';
import { useDatosML } from '../useDatosML';

/** Días de histórico que se ven antes del pronóstico. */
export const DIAS_CONTEXTO = 60;

export interface Dia {
  fecha: string;
  esperadas: number;
  minimo: number;
  maximo: number;
  confirmadas: number;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function sumar(valores: number[]): number {
  return valores.reduce((a, v) => a + v, 0);
}

interface DatosReservas {
  forecast: ForecastDemanda | null;
  calidad: CalidadModelo | null;
  tipos: TiposEspacioML | null;
}

/**
 * Pronóstico de reservas: el del campus o el de un tipo de espacio, y la
 * tabla de todos los tipos. Los tres pedidos van juntos; si el de tipos falla
 * (backend viejo, sin modelos por tipo) el resto se muestra igual.
 */
export function usePredicciones(tipoEspacioId: number | null, version: number) {
  const { datos, cargando, error } = useDatosML<DatosReservas>(
    async () => {
      const [f, c, t] = await Promise.all([
        statsApi.forecastDemanda(DIAS_CONTEXTO, tipoEspacioId),
        statsApi.calidadModeloML(tipoEspacioId),
        statsApi.tiposEspacioML().catch(() => null),
      ]);
      return { success: true, data: { forecast: f.data ?? null, calidad: c.data ?? null, tipos: t?.data ?? null } };
    },
    version,
    String(tipoEspacioId ?? 'global'),
  );

  const forecast = datos?.forecast ?? null;
  const calidad = datos?.calidad ?? null;

  const derivado = useMemo(() => {
    if (!forecast || forecast.modeloId == null || forecast.predicciones.length === 0) return null;

    const confirmadasPorFecha = new Map((forecast.reservadas ?? []).map((r) => [r.fecha, r.cantidad]));
    const dias: Dia[] = forecast.predicciones.map((p) => ({
      fecha: p.fecha,
      esperadas: p.prediccion,
      minimo: p.bandaInferior ?? p.prediccion,
      maximo: p.bandaSuperior ?? p.prediccion,
      confirmadas: confirmadasPorFecha.get(p.fecha) ?? 0,
    }));

    const historico = forecast.historico.slice(-DIAS_CONTEXTO);
    const total = sumar(dias.map((d) => d.esperadas));
    // Mismo largo que el horizonte, para comparar peras con peras.
    const previos = historico.slice(-dias.length);
    const totalPrevio = sumar(previos.map((h) => h.real));
    const variacion = totalPrevio > 0 ? ((total - totalPrevio) / totalPrevio) * 100 : null;

    const pico = dias.reduce((max, d) => (d.esperadas > max.esperadas ? d : max), dias[0]);
    const confirmadas = sumar(dias.map((d) => d.confirmadas));
    // Ancho medio de la banda: "más o menos cuánto" en una sola cifra.
    const margen = sumar(dias.map((d) => (d.maximo - d.minimo) / 2)) / dias.length;

    const semana = DIAS_SEMANA.map((nombre, i) => {
      const delDia = dias.filter((d) => diaSemana(d.fecha) === i);
      return { dia: nombre, valor: delDia.length ? sumar(delDia.map((d) => d.esperadas)) / delDia.length : 0 };
    });

    const hoy = forecast.hoy ?? new Date().toISOString().slice(0, 10);
    // El horizonte arranca el día siguiente al último dato. Si ese día ya
    // pasó, el modelo no se reentrenó con lo que vino después.
    const desactualizado = dias[0].fecha < hoy;

    return {
      dias,
      historico,
      total,
      totalPrevio,
      variacion,
      promedio: total / dias.length,
      pico,
      confirmadas,
      margen,
      cobertura: total > 0 ? (confirmadas / total) * 100 : null,
      semana,
      hoy,
      desactualizado,
    };
  }, [forecast]);

  const precision = useMemo(() => {
    if (!calidad || calidad.wape == null) return null;
    const modelo = Number(calidad.wape);
    const referencia = calidad.wapeIngenuo == null ? null : Number(calidad.wapeIngenuo);
    return {
      modelo,
      referencia,
      // Cuánto error le saca a la referencia, en proporción.
      mejora: referencia && referencia > 0 ? ((referencia - modelo) / referencia) * 100 : null,
    };
  }, [calidad]);

  return {
    forecast,
    calidad,
    tipos: datos?.tipos?.tipos ?? [],
    cargando,
    error,
    derivado,
    precision,
    // Recién se sabe que no hay modelo cuando llegó una respuesta.
    sinModelo: !cargando && !error && (!forecast || forecast.modeloId == null),
  };
}

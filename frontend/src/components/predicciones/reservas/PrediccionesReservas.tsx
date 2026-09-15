import { useSearchParams } from 'react-router-dom';
import { Brain, CalendarCheck, CalendarRange, Target, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import { postAnalyzeForecast } from '@/lib/api/ai';
import { AnalisisIA } from '../AnalisisIA';
import { Aviso, ChipHero, Esqueleto, Hero, NoCargo, NotaModelo, SinModelo, type Entrenamiento } from '../comunes';
import { entero, fechaCorta, fechaLarga } from '../formato';
import { Confiabilidad } from './Confiabilidad';
import { GraficoDemanda } from './GraficoDemanda';
import { PronosticoPorTipo, TablaTipos } from './PorTipoEspacio';
import { SemanaTipica } from './SemanaTipica';
import { TablaDias } from './TablaDias';
import { usePredicciones } from './usePredicciones';

/**
 * Predicciones de reservas: la demanda de los próximos 30 días del campus (o
 * de un tipo de espacio, con ?tipoEspacio=), cuánto creerle y cómo se reparte
 * por tipo.
 */
export default function PrediccionesReservas({ version, entrenamiento }: Readonly<{ version: number; entrenamiento: Entrenamiento }>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pedido = Number(searchParams.get('tipoEspacio'));
  const tipoEspacioId = Number.isInteger(pedido) && pedido > 0 ? pedido : null;
  const { esAdmin } = entrenamiento;

  const { forecast, calidad, tipos, cargando, error, derivado, precision, sinModelo } = usePredicciones(tipoEspacioId, version);
  const tipoElegido = tipos.find((t) => t.tipoEspacioId === tipoEspacioId) ?? null;

  const elegirTipo = (id: number | null) => {
    setSearchParams(
      (p) => {
        const nuevo = new URLSearchParams(p);
        if (id == null) nuevo.delete('tipoEspacio');
        else nuevo.set('tipoEspacio', String(id));
        return nuevo;
      },
      { replace: true },
    );
    // Elegido desde abajo: lo que cambia es el hero y el gráfico de arriba.
    if (id != null) document.getElementById('predicciones-reservas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (cargando && !forecast) return <Esqueleto />;
  if (error && !forecast) return <NoCargo />;

  if (sinModelo || !derivado || !forecast) {
    return tipoEspacioId != null ? (
      <Aviso tono="info" titulo={`${tipoElegido?.nombre ?? 'Este tipo'} no tiene modelo propio.`}>
        Tiene muy poca historia para pronosticarlo por separado.{' '}
        <button type="button" className="font-semibold underline underline-offset-2" onClick={() => elegirTipo(null)}>
          Ver el campus entero
        </button>
      </Aviso>
    ) : (
      <SinModelo
        titulo="Todavía no hay un modelo entrenado"
        detalle='Entrenalo con "Reentrenar": usa el histórico de reservas aprobadas, necesita al menos 30 días y entrena también un modelo por tipo de espacio.'
        entrenamiento={entrenamiento}
        textoBoton="Entrenar el modelo de reservas"
      />
    );
  }

  const { dias, historico, total, totalPrevio, variacion, promedio, pico, confirmadas, cobertura, semana, desactualizado } = derivado;
  const sube = (variacion ?? 0) >= 0;
  const precisionModelo = precision ? Math.max(0, 100 - precision.modelo) : null;
  const delAlcance = tipoElegido ? `de ${tipoElegido.nombre}` : 'del campus';

  return (
    // pb-16: el botón flotante del asistente tapaba lo último de la página.
    <div id="predicciones-reservas" className={`scroll-mt-4 space-y-3 pb-16 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      {desactualizado && (
        <Aviso>
          El modelo se entrenó con datos hasta el {fechaLarga(calidad?.historicoHasta ?? historico.at(-1)?.fecha ?? dias[0].fecha)},
          así que el pronóstico arranca el {fechaCorta(dias[0].fecha)} y no hoy.
          {esAdmin ? ' Reentrenalo para que tome lo que pasó después.' : ' Pedile a un administrador que lo reentrene.'}
        </Aviso>
      )}

      <Hero
        rango={
          <>
            <CalendarRange className="h-3.5 w-3.5" />
            {fechaCorta(dias[0].fecha)} al {fechaCorta(dias.at(-1)!.fecha)}
            {tipoElegido && <span className="text-white/40">· {tipoElegido.nombre}</span>}
          </>
        }
        titulo={`Se esperan ${entero(total)} reservas${tipoElegido ? ` en ${tipoElegido.nombre}` : ''}`}
        detalle={
          <>
            {variacion != null && (
              <ChipHero>
                {sube ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {sube ? '+' : ''}
                {Math.round(variacion)}%
              </ChipHero>
            )}
            <span>contra {entero(totalPrevio)} en los 30 días anteriores</span>
            <span className="text-white/40">·</span>
            <span>pico el {fechaLarga(pico.fecha)}</span>
          </>
        }
        extra={
          tipoElegido && (
            <button
              type="button"
              onClick={() => elegirTipo(null)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-3 w-3" />
              Volver al campus entero
            </button>
          )
        }
        anillo={precisionModelo == null ? null : { valor: precisionModelo, texto: 'precisión en validación' }}
      />

      <StatStrip
        items={[
          { label: 'Por día', value: entero(promedio), hint: 'en promedio', icon: CalendarRange, bg: 'blue' },
          { label: 'Día pico', value: entero(pico.esperadas), hint: fechaCorta(pico.fecha), icon: TrendingUp, bg: 'orange' },
          {
            label: 'Ya aprobadas',
            value: entero(confirmadas),
            hint: cobertura != null ? `${Math.round(cobertura)}% de lo esperado` : 'en el período',
            icon: CalendarCheck,
            bg: 'green',
          },
          {
            label: 'Error típico',
            value: calidad?.mae != null ? `±${entero(Number(calidad.mae))}` : '—',
            hint: 'reservas por día',
            icon: Target,
            bg: 'cyan',
          },
          { label: 'Entrenado con', value: calidad?.sampleSize ?? '—', hint: 'días de histórico', icon: Brain, bg: 'dark' },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Demanda diaria"
          count={`${tipoElegido ? `${tipoElegido.nombre} · ` : ''}últimos ${historico.length} días y próximos ${dias.length}`}
          accentColor="#DE7A27"
          className="lg:col-span-2"
        >
          <GraficoDemanda historico={historico} dias={dias} alto={320} />
        </Panel>

        <Panel title="¿Qué tan confiable es?" accentColor="#86bb4c">
          {precision && calidad?.validacion?.length ? (
            <Confiabilidad
              validacion={calidad.validacion}
              modelo={precision.modelo}
              referencia={precision.referencia}
              mejora={precision.mejora}
              mae={calidad.mae == null ? null : Number(calidad.mae)}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Este modelo se entrenó antes de guardar la validación.
              {esAdmin && ' Reentrenalo para verla.'}
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Día por día" count={`${dias.length} días`} accentColor="#184897" flush scroll className="max-h-[440px] lg:col-span-2">
          <TablaDias dias={dias} />
        </Panel>

        <div className="grid gap-3 lg:grid-rows-[auto_1fr]">
          <Panel title="Semana típica" count="reservas por día" accentColor="#DE7A27">
            <div className="h-[150px]">
              <SemanaTipica semana={semana} />
            </div>
          </Panel>
          <Panel title="Lectura con IA" accentColor="#00c7ff">
            <AnalisisIA
              clave={`${tipoEspacioId ?? 'global'}-${forecast.modeloId}`}
              descripcion={`Resume la tendencia ${delAlcance}, los días de más demanda y cuáles ya tienen casi todo reservado, con una recomendación concreta.`}
              pedir={() =>
                postAnalyzeForecast({
                  historico: forecast.historico.map((h) => ({ fecha: h.fecha, real: h.real })),
                  predicciones: forecast.predicciones.map((p) => ({
                    fecha: p.fecha,
                    prediccion: Math.round(p.prediccion),
                    bandaInferior: p.bandaInferior == null ? null : Math.round(p.bandaInferior),
                    bandaSuperior: p.bandaSuperior == null ? null : Math.round(p.bandaSuperior),
                  })),
                  reservadas: (forecast.reservadas ?? []).map((r) => ({ fecha: r.fecha, cantidad: r.cantidad })),
                  wape: precision?.modelo ?? null,
                  mape: calidad?.mape == null ? null : Number(calidad.mape),
                })
              }
            />
          </Panel>
        </div>
      </div>

      {tipos.length > 0 && (
        <>
          <Panel
            title="Por tipo de espacio"
            count={tipoElegido ? `viendo ${tipoElegido.nombre} arriba · tocá otro o volvé al campus` : 'próximos 30 días · tocá uno para verlo arriba'}
            accentColor="#184897"
          >
            <PronosticoPorTipo tipos={tipos} elegido={tipoEspacioId} onElegir={elegirTipo} />
          </Panel>
          {/* Sin ningún tipo entrenado la tabla sería una grilla de guiones: las tarjetas ya lo dicen. */}
          {tipos.some((t) => t.entrenado) && (
            <Panel title="Comparación por tipo" count="esperado, cambio y error de cada uno" accentColor="#00c7ff" flush>
              <div className="py-2">
                <TablaTipos tipos={tipos} elegido={tipoEspacioId} onElegir={elegirTipo} />
              </div>
            </Panel>
          )}
        </>
      )}

      <NotaModelo>
        Modelo {calidad?.algoritmo === 'prophet' ? 'Prophet' : calidad?.algoritmo} {delAlcance} entrenado por el servicio de ML
        {calidad?.trainedAt && ` el ${new Date(calidad.trainedAt).toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })}`}
        {calidad?.historicoDesde && calidad?.historicoHasta && `, con reservas aprobadas del ${fechaCorta(calidad.historicoDesde)} al ${fechaCorta(calidad.historicoHasta)}`}
        . Estacionalidad semanal{calidad?.estacionalidadAnual ? ' y anual' : ''}; se reentrena cada domingo.
      </NotaModelo>
    </div>
  );
}

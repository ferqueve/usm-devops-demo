import { useSearchParams } from 'react-router-dom';
import { Boxes, CalendarRange, MousePointerClick, PackageX, Siren, Target } from 'lucide-react';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { postAnalyzeInventarioForecast } from '@/lib/api/ai';
import { statsApi, type PrediccionInventario } from '@/lib/api/stats';
import { AnalisisIA } from '../AnalisisIA';
import { Aviso, ChipHero, Esqueleto, Hero, NoCargo, NotaModelo, SinModelo, type Entrenamiento } from '../comunes';
import { decimal, entero, fechaConDia, fechaCorta, fechaLarga, porcentaje01 } from '../formato';
import { useDatosML } from '../useDatosML';
import { ComoFunciona, ErrorPorTipo } from './ConfiabilidadInventario';
import { GraficoPico, PatronSemanal, SelectorTipos, SemanasTipo, TiraRiesgo } from './Detalle';
import { MatrizRiesgo, Semaforo, YaFalta } from './Riesgo';
import { comprometidasMax, estiloRiesgo } from './estilos';
import { MARCA } from '@/lib/design/paleta';

/**
 * Predicciones de inventario: si el equipamiento va a alcanzar. Primero qué
 * tipos pueden faltar y cuándo, después el detalle de uno (?tipoElemento=) y
 * al final cuánto creerle al modelo.
 */
export default function PrediccionesInventario({ version, entrenamiento }: Readonly<{ version: number; entrenamiento: Entrenamiento }>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tema = useTemaGraficos();
  const { datos, cargando, error } = useDatosML<PrediccionInventario>(() => statsApi.inventarioML(), version);

  const tipos = datos?.tipos ?? [];
  const modelados = tipos.filter((t) => t.status === 'ok');
  const pedido = Number(searchParams.get('tipoElemento'));
  // Sin elección, el más urgente: el servidor ya los manda ordenados por riesgo.
  const tipo = tipos.find((t) => t.tipoElementoId === pedido) ?? modelados[0] ?? tipos[0] ?? null;

  const elegirTipo = (id: number, bajar = false) => {
    setSearchParams(
      (p) => {
        const nuevo = new URLSearchParams(p);
        nuevo.set('tipoElemento', String(id));
        return nuevo;
      },
      { replace: true },
    );
    if (bajar) document.getElementById('detalle-tipo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (cargando && !datos) return <Esqueleto />;
  if (error && !datos) return <NoCargo />;
  if (!datos || !datos.modelo.entrenado) {
    return (
      <SinModelo
        titulo="Todavía no hay un modelo de inventario"
        detalle="Entrenalo: aprende del histórico de pedidos de equipamiento cuántas unidades de cada tipo se piden a la vez, y calcula el riesgo de que no alcance."
        entrenamiento={entrenamiento}
        textoBoton="Entrenar el modelo de inventario"
      />
    );
  }

  const { modelo } = datos;
  const resumen = datos.resumen ?? { tipos: tipos.length, tiposEnRiesgo: 0, tiposSinStock: 0, primerFaltante: null };
  const horizonte = modelo.horizonteDias ?? 30;
  const pierde = modelo.wape != null && modelo.wapeIngenuo != null && modelo.wape >= modelo.wapeIngenuo;
  const pueden = resumen.tiposEnRiesgo + resumen.tiposSinStock;
  const primero = resumen.primerFaltante;
  const estiloTipo = tipo ? estiloRiesgo(tipo.status === 'omitido' ? null : tipo.riesgo, tema) : null;
  const precision = modelo.wape == null ? null : Math.max(0, 100 - modelo.wape);

  return (
    <div className={`space-y-3 pb-16 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      <YaFalta tipos={tipos} />

      <Hero
        rango={
          <>
            <CalendarRange className="h-3.5 w-3.5" />
            próximos {horizonte} días · contra el stock de hoy
          </>
        }
        titulo={
          pueden > 0
            ? `${entero(pueden)} ${pueden === 1 ? 'tipo de equipo puede' : 'tipos de equipo pueden'} no alcanzar`
            : 'El equipamiento alcanza para lo que viene'
        }
        detalle={
          primero ? (
            <>
              <ChipHero>
                <Siren className="h-3.5 w-3.5" />
                {porcentaje01(primero.probabilidad)}
              </ChipHero>
              <span>
                el primero es {primero.nombre}, el {fechaLarga(primero.fecha)}
              </span>
              {resumen.tiposSinStock > 0 && (
                <>
                  <span className="text-white/40">·</span>
                  <span>
                    {entero(resumen.tiposSinStock)} {resumen.tiposSinStock === 1 ? 'se pide y no tiene' : 'se piden y no tienen'} unidades disponibles hoy
                  </span>
                </>
              )}
            </>
          ) : (
            <span>Ningún día supera el 50% de probabilidad de pedir más de lo que hay disponible.</span>
          )
        }
        extra={
          primero && (
            <button
              type="button"
              onClick={() => elegirTipo(primero.tipoElementoId, true)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white"
            >
              <MousePointerClick className="h-3 w-3" />
              Ver {primero.nombre} día por día
            </button>
          )
        }
        anillo={precision == null ? null : { valor: precision, texto: 'precisión en validación' }}
      />

      <StatStrip
        items={[
          { label: 'En riesgo', value: entero(resumen.tiposEnRiesgo), hint: `de ${entero(resumen.tipos)} tipos`, icon: Siren, bg: 'red' },
          { label: 'Sin stock', value: entero(resumen.tiposSinStock), hint: 'se piden y no hay', icon: PackageX, bg: 'dark' },
          { label: 'Primer faltante', value: primero ? fechaCorta(primero.fecha) : '—', hint: primero ? primero.nombre : 'ninguno probable', icon: CalendarRange, bg: 'orange' },
          { label: 'Tipos modelados', value: `${entero(modelados.length)}/${entero(tipos.length)}`, hint: 'con pedidos suficientes', icon: Boxes, bg: 'blue' },
          {
            label: 'Error típico',
            value: modelo.wape == null ? '—' : `${decimal(modelo.wape, 0)}%`,
            hint: modelo.wapeIngenuo == null ? 'en el pico diario' : `repetir la semana: ${decimal(modelo.wapeIngenuo, 0)}%`,
            icon: Target,
            bg: 'cyan',
          },
        ]}
      />

      <div className="grid gap-3 lg:h-[520px] lg:grid-cols-3">
        <Panel title="Riesgo por tipo" count="de lo más urgente a lo más tranquilo · tocá uno" accentColor={MARCA.rojo} className="lg:col-span-2" scroll>
          <Semaforo tipos={tipos} elegido={tipo?.tipoElementoId ?? null} onElegir={(id) => elegirTipo(id, true)} />
        </Panel>
        <Panel title="Semana a semana" count="probabilidad máxima de faltante (%)" accentColor={MARCA.naranja} scroll>
          <MatrizRiesgo tipos={tipos} />
        </Panel>
      </div>

      <div id="detalle-tipo" className="scroll-mt-4 space-y-3">
        <SelectorTipos tipos={tipos} elegido={tipo?.tipoElementoId ?? null} onElegir={(id) => elegirTipo(id)} />

        {!tipo ? null : tipo.status === 'omitido' ? (
          <Aviso tono="info" titulo={`${tipo.nombre} no se modela.`}>
            {tipo.detalle ?? 'Tiene muy pocos días con pedidos para estimar su demanda.'} Hacen falta al menos 20 días con pedidos.
          </Aviso>
        ) : (
          <>
            <div className="grid gap-3 lg:h-[460px] lg:grid-cols-3">
              <Panel title="Pico diario" count={`${tipo.nombre} · unidades pedidas a la vez`} accentColor={MARCA.naranja} className="lg:col-span-2">
                <div className="space-y-3">
                  <GraficoPico tipo={tipo} alto={300} />
                  <TiraRiesgo serie={tipo.serie} />
                </div>
              </Panel>
              <div className="grid gap-3 lg:grid-rows-2">
                <Panel title="Semana típica" count="multiplicador por día" accentColor={MARCA.azul}>
                  <div className="flex h-full flex-col justify-center">
                    <PatronSemanal tipo={tipo} alto={96} />
                  </div>
                </Panel>
                <Panel title="Chance de que falte" count="el peor día" accentColor={MARCA.rojo}>
                  <div className="flex h-full items-center justify-center gap-4">
                    <div className="w-[150px]">
                      <Medidor valor={(tipo.probFaltanteMax ?? 0) * 100} etiqueta={estiloTipo?.etiqueta ?? 'Riesgo'} color={estiloTipo?.color} ancho={150} />
                    </div>
                    <dl className="space-y-1 text-xs">
                      <div>
                        <dt className="inline text-muted-foreground">Días en riesgo: </dt>
                        <dd className="inline font-semibold tabular-nums">{entero(tipo.diasEnRiesgo)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">Día pico: </dt>
                        <dd className="inline font-semibold">{tipo.fechaPico ? fechaConDia(tipo.fechaPico) : '—'}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">Disponibles: </dt>
                        <dd className="inline font-semibold tabular-nums">
                          {entero(tipo.stockDisponible)} de {entero(tipo.stockTotal)}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">Ya pedido máx.: </dt>
                        <dd className="inline font-semibold tabular-nums">{entero(comprometidasMax(tipo))}</dd>
                      </div>
                    </dl>
                  </div>
                </Panel>
              </div>
            </div>

            <Panel title="Semana por semana" count={`${tipo.nombre} · ${horizonte} días`} accentColor={MARCA.azul} flush>
              <div className="py-1">
                <SemanasTipo tipo={tipo} />
              </div>
            </Panel>
          </>
        )}
      </div>

      {pierde && (
        <Aviso titulo="Todavía no le gana a la alternativa simple.">
          En validación se equivocó tanto o más que repetir la última semana: usá el riesgo como orientación y no como certeza.
        </Aviso>
      )}

      <div className="grid gap-3 lg:h-[440px] lg:grid-cols-3">
        <Panel title="¿Qué tan confiable es?" count={`error por tipo · últimos ${modelo.holdoutDias ?? 28} días`} accentColor={MARCA.verde} className="lg:col-span-2" scroll>
          <ErrorPorTipo modelo={modelo} tipos={tipos} />
        </Panel>
        <Panel title="Cómo funciona" count="binomial negativa" accentColor={MARCA.amarillo} scroll>
          <ComoFunciona modelo={modelo} />
        </Panel>
      </div>

      <Panel title="Lectura con IA" accentColor={MARCA.cian}>
        <AnalisisIA
          clave={modelo.entrenadoEn ?? ''}
          descripcion="Dice qué tipos van a faltar y cuándo, cuántas unidades conviene conseguir o cómo redistribuir, y si el error del modelo pide tomarlo con cuidado."
          pedir={() =>
            postAnalyzeInventarioForecast({
              wape: modelo.wape ?? null,
              tipos: modelados.map((t) => ({
                nombre: t.nombre,
                stockDisponible: t.stockDisponible,
                picoEsperado: t.picoEsperado == null ? null : Math.round(t.picoEsperado * 10) / 10,
                fechaPico: t.fechaPico,
                probFaltanteMax: t.probFaltanteMax == null ? null : Math.round(t.probFaltanteMax * 100) / 100,
                diasEnRiesgo: t.diasEnRiesgo,
                riesgo: t.riesgo,
                comprometidasMax: comprometidasMax(t),
              })),
            })
          }
        />
      </Panel>

      <NotaModelo>
        Modelo de inventario (binomial negativa) entrenado por el servicio de ML
        {modelo.entrenadoEn && ` el ${new Date(modelo.entrenadoEn).toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })}`}
        {modelo.historicoDesde && modelo.historicoHasta && `, con pedidos del ${fechaCorta(modelo.historicoDesde)} al ${fechaCorta(modelo.historicoHasta)}`}
        . El stock disponible es el de hoy; se reentrena cada domingo.
      </NotaModelo>
    </div>
  );
}

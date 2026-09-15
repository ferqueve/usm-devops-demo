import { useState } from 'react';
import { CalendarRange, CalendarX2, History, UserCheck, Users, UsersRound, UserX } from 'lucide-react';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import { postAnalyzeAsistencia } from '@/lib/api/ai';
import { statsApi, type PrediccionAcademico, type TutoriaProximaML } from '@/lib/api/stats';
import { AnalisisIA } from '../AnalisisIA';
import { Aviso, ChipHero, Dato, Esqueleto, Hero, NoCargo, NotaModelo, SinModelo, type Entrenamiento } from '../comunes';
import { decimal, entero, fechaCorta, partesInstante, porcentaje01 } from '../formato';
import { useDatosML } from '../useDatosML';
import { BrierContraBase, CurvaCalibracion, HistoricoSemanal, MedidorAuc } from './ConfiabilidadAcademico';
import { DetalleTutoria } from './DetalleTutoria';
import { FactoresEnPalabras, GraficoFactores } from './Factores';
import { DonaRiesgo, EsperadosPorSemana, ListaProximas } from './Proximas';
import { modeloFlojo } from './estilos';

/** Resumen de las próximas cuando el servidor no lo manda (no debería pasar, pero la vista no se rompe). */
function resumenDe(proximas: TutoriaProximaML[]): NonNullable<PrediccionAcademico['resumen']> {
  const conPrediccion = proximas.filter((t) => t.esperados != null);
  const inscriptos = conPrediccion.reduce((a, t) => a + t.inscriptos, 0);
  const esperados = conPrediccion.reduce((a, t) => a + (t.esperados ?? 0), 0);
  return {
    proximas: proximas.length,
    inscriptos: proximas.reduce((a, t) => a + t.inscriptos, 0),
    esperados,
    tasaEsperada: inscriptos > 0 ? esperados / inscriptos : null,
    enRiesgoVacias: proximas.filter((t) => t.riesgo === 'vacia').length,
    desbordadas: proximas.filter((t) => t.riesgo === 'alta').length,
  };
}

/**
 * Predicciones académicas: cuántos van a ir a cada tutoría que viene, qué
 * pesa en la asistencia y cuánto creerle al modelo, dicho sin vueltas.
 */
export default function PrediccionesAcademico({ version, entrenamiento }: Readonly<{ version: number; entrenamiento: Entrenamiento }>) {
  const { datos, cargando, error } = useDatosML<PrediccionAcademico>(() => statsApi.academicoML(), version);
  const [abierta, setAbierta] = useState<TutoriaProximaML | null>(null);

  if (cargando && !datos) return <Esqueleto />;
  if (error && !datos) return <NoCargo />;
  if (!datos || !datos.modelo.entrenado) {
    return (
      <SinModelo
        titulo="Todavía no hay un modelo de asistencia"
        detalle="Entrenalo: aprende de las tutorías pasadas quién fue y quién no, y necesita al menos 100 inscripciones con la asistencia cargada."
        entrenamiento={entrenamiento}
        textoBoton="Entrenar el modelo académico"
      />
    );
  }

  const { modelo, proximas } = datos;
  const resumen = datos.resumen ?? resumenDe(proximas);
  const factores = modelo.factores ?? [];
  const flojo = modeloFlojo(modelo.auc, modelo.brier, modelo.brierBase);
  const sinPrediccion = proximas.filter((t) => t.riesgo === 'sin_prediccion').length;
  const cupoTotal = proximas.reduce((a, t) => a + (t.cupo ?? 0), 0);
  const primera = proximas[0];
  const ultima = proximas.at(-1);
  const tasa = resumen.tasaEsperada == null ? null : resumen.tasaEsperada * 100;

  return (
    <div className={`space-y-3 pb-16 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      {flojo && (
        <Aviso titulo="El modelo todavía no predice mejor que el promedio.">
          {modelo.auc != null && modelo.auc < 0.6
            ? `En validación separa a quien va de quien no ${Math.round(modelo.auc * 10)} de cada 10 veces, casi como tirar una moneda. `
            : `En validación su error (${decimal(modelo.brier, 3)}) no es menor que decir siempre la tasa promedio (${decimal(modelo.brierBase, 3)}). `}
          Tomá los esperados como orientación: con más tutorías registradas va a ir mejorando.
        </Aviso>
      )}

      <Hero
        rango={
          <>
            <CalendarRange className="h-3.5 w-3.5" />
            {primera && ultima ? `${fechaCorta(partesInstante(primera.inicio).fecha)} al ${fechaCorta(partesInstante(ultima.inicio).fecha)}` : 'tutorías que vienen'}
          </>
        }
        titulo={
          proximas.length === 0
            ? 'No hay tutorías próximas'
            : `Se esperan ${entero(resumen.esperados)} asistentes en ${entero(resumen.proximas)} ${resumen.proximas === 1 ? 'tutoría' : 'tutorías'}`
        }
        detalle={
          proximas.length === 0 ? (
            <span>Cuando se agenden tutorías con inscriptos van a aparecer acá con su asistencia esperada.</span>
          ) : (
            <>
              <ChipHero>
                <Users className="h-3.5 w-3.5" />
                {entero(resumen.inscriptos)} inscriptos
              </ChipHero>
              {resumen.enRiesgoVacias > 0 && <span>{entero(resumen.enRiesgoVacias)} pueden quedar casi vacías</span>}
              {resumen.enRiesgoVacias > 0 && resumen.desbordadas > 0 && <span className="text-white/40">·</span>}
              {resumen.desbordadas > 0 && <span>{entero(resumen.desbordadas)} se llenan</span>}
            </>
          )
        }
        anillo={tasa == null ? null : { valor: tasa, texto: 'asistencia esperada' }}
      />

      <StatStrip
        items={[
          { label: 'Inscriptos', value: entero(resumen.inscriptos), hint: cupoTotal ? `${entero(cupoTotal)} lugares` : 'en las próximas', icon: Users, bg: 'blue' },
          { label: 'Esperados', value: entero(resumen.esperados), hint: `${porcentaje01(resumen.tasaEsperada)} de los inscriptos`, icon: UserCheck, bg: 'green' },
          { label: 'Casi vacías', value: entero(resumen.enRiesgoVacias), hint: 'menos de 1,5 esperados', icon: UserX, bg: 'red' },
          { label: 'Se llenan', value: entero(resumen.desbordadas), hint: 'esperados ≥ 90% del cupo', icon: UsersRound, bg: 'orange' },
          {
            label: 'Asistencia histórica',
            value: porcentaje01(modelo.tasaBase),
            hint: sinPrediccion ? `${sinPrediccion} sin predicción aún` : 'en tutorías pasadas',
            icon: History,
            bg: 'dark',
          },
        ]}
      />

      {proximas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <CalendarX2 className="h-10 w-10 text-muted-foreground/60" />
          <h3 className="text-base font-semibold">No hay tutorías próximas</h3>
          <p className="max-w-md text-sm text-muted-foreground">Mientras tanto, abajo está lo que aprendió el modelo y cuánto creerle.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:h-[560px] lg:grid-cols-3">
          <Panel
            title="Tutorías que vienen"
            count={`${entero(proximas.length)} · tocá una para ver a los inscriptos`}
            accentColor="#DE7A27"
            className="lg:col-span-2"
            scroll
            flush
          >
            <ListaProximas proximas={proximas} onAbrir={setAbierta} />
          </Panel>
          <div className="grid gap-3 lg:grid-rows-2">
            <Panel title="Cómo vienen" count="tutorías por riesgo" accentColor="#DF2B31">
              <div className="flex h-full flex-col justify-center">
                <DonaRiesgo proximas={proximas} />
              </div>
            </Panel>
            <Panel title="Semana a semana" count="van y faltan" accentColor="#86bb4c">
              <div className="flex h-full flex-col justify-center">
                <EsperadosPorSemana proximas={proximas} alto={150} />
              </div>
            </Panel>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:h-[420px] lg:grid-cols-3">
        <Panel title="Qué influye" count="qué hace que vaya o falte" accentColor="#9333ea" className="lg:col-span-2">
          <div className="flex h-full flex-col justify-center">
            <GraficoFactores factores={factores} />
          </div>
        </Panel>
        <Panel title="En palabras" count="lo que más sube y baja" accentColor="#F6CA21" scroll>
          <FactoresEnPalabras factores={factores} />
        </Panel>
      </div>

      <div className="grid gap-3 lg:h-[340px] lg:grid-cols-3">
        <Panel title="¿Distingue quién va?" count="en validación" accentColor="#86bb4c">
          <div className="flex h-full flex-col justify-center">
            <MedidorAuc auc={modelo.auc} />
          </div>
        </Panel>
        <Panel title="¿Mejor que el promedio?" count="error contra la base" accentColor="#F6CA21">
          <div className="flex h-full flex-col justify-center">
            <BrierContraBase modelo={modelo} />
          </div>
        </Panel>
        <Panel title="Calibración" count="predicho contra real" accentColor="#184897">
          <div className="flex h-full flex-col justify-center">
            <CurvaCalibracion calibracion={modelo.calibracion} alto={230} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Semanas de validación"
          count={modelo.validacion ? `${fechaCorta(modelo.validacion.desde)} al ${fechaCorta(modelo.validacion.hasta)} · esperados contra los que fueron` : undefined}
          accentColor="#DE7A27"
          className="lg:col-span-2"
        >
          <HistoricoSemanal semanas={modelo.historicoSemanal} alto={260} />
        </Panel>
        <div className="grid gap-3 lg:grid-rows-[auto_1fr]">
          <Panel title="Cómo se entrenó" count="regresión logística" accentColor="#9333ea">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <Dato etiqueta="Inscripciones" valor={entero(modelo.muestras)} />
              <Dato etiqueta="Asistencia base" valor={porcentaje01(modelo.tasaBase)} />
              <Dato etiqueta="Validación" valor={modelo.validacion ? `${entero(modelo.validacion.n)} más recientes` : '—'} />
              <Dato etiqueta="AUC" valor={decimal(modelo.auc, 2)} />
            </dl>
          </Panel>
          <Panel title="Lectura con IA" accentColor="#00c7ff">
            <AnalisisIA
              clave={modelo.entrenadoEn ?? ''}
              descripcion="Dice qué tutorías van a quedar vacías o desbordadas, qué pesa más en la asistencia y qué conviene hacer."
              pedir={() =>
                postAnalyzeAsistencia({
                  auc: modelo.auc ?? null,
                  tasaBase: modelo.tasaBase ?? null,
                  resumen: { ...resumen },
                  // Primero las que piden acción: con 25 como tope, que no se pierdan entre las normales.
                  proximas: [...proximas]
                    .sort((a, b) => Number(b.riesgo !== 'normal') - Number(a.riesgo !== 'normal'))
                    .slice(0, 25)
                    .map((t) => ({
                      materia: t.materia,
                      inicio: t.inicio,
                      cupo: t.cupo,
                      inscriptos: t.inscriptos,
                      esperados: t.esperados == null ? null : Math.round(t.esperados * 10) / 10,
                      riesgo: t.riesgo,
                    })),
                  factores: factores.map((f) => ({ nombre: f.nombre, oddsRatio: Math.round(f.oddsRatio * 100) / 100 })),
                })
              }
            />
          </Panel>
        </div>
      </div>

      <NotaModelo>
        Modelo de asistencia (regresión logística) entrenado por el servicio de ML
        {modelo.entrenadoEn && ` el ${new Date(modelo.entrenadoEn).toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })}`}
        {modelo.muestras != null && ` con ${entero(modelo.muestras)} inscripciones de tutorías pasadas`}. Mira la modalidad, el horario, la antelación, qué tan
        lleno está el cupo y la historia del estudiante y de la materia; no usa la confirmación ni el estado de la inscripción, que se conocen recién después.
        Las tutorías creadas después del entrenamiento aparecen sin predicción hasta que se reentrene.
      </NotaModelo>

      <DetalleTutoria tutoria={abierta} onCerrar={() => setAbierta(null)} />
    </div>
  );
}

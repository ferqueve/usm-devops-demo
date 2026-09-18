import type { ReactNode } from 'react';

import { MARCA } from '@/lib/design/paleta';
import {
  Anillo,
  BarrasHorizontales,
  Progreso,
  RitmoSemanal,
  Tendencia,
} from '@/components/dashboard/views/_components/Graficos';
import { Apiladas100 } from '@/components/statistics/graficos/Apiladas100';
import { BarrasDivergentes } from '@/components/statistics/graficos/BarrasDivergentes';
import { BarrasTramos } from '@/components/statistics/graficos/BarrasTramos';
import { Burbujas } from '@/components/statistics/graficos/Burbujas';
import { CalendarioCalor } from '@/components/statistics/graficos/CalendarioCalor';
import { Dona } from '@/components/statistics/graficos/Dona';
import { Embudo } from '@/components/statistics/graficos/Embudo';
import { Mancuernas } from '@/components/statistics/graficos/Mancuernas';
import { MapaArbol } from '@/components/statistics/graficos/MapaArbol';
import { MatrizCalor } from '@/components/statistics/graficos/MatrizCalor';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { RadarSemana } from '@/components/statistics/graficos/RadarSemana';
import { TarjetasKpi } from '@/components/statistics/graficos/TarjetasKpi';
import { Waffle } from '@/components/statistics/graficos/Waffle';

import {
  DIAS_CALOR,
  DIAS_SEMANA,
  ETAPAS_EMBUDO,
  FILAS_APILADAS,
  FILAS_DIVERGENTES,
  FILAS_MANCUERNA,
  KPIS_ESTADISTICAS,
  MATRIZ,
  NODOS_ARBOL,
  PORCIONES,
  PUNTOS_BURBUJA,
  SERIE_MESES,
  TRAMOS,
  GRUPOS_WAFFLE,
} from './_datos';

/**
 * Los diecinueve gráficos del sistema, en un solo lugar.
 *
 * Están repartidos en dos familias que nacieron por separado: las cinco de
 * `dashboard/views/_components/Graficos` —compactas, para acompañar listas— y
 * las catorce de `statistics/graficos`, que son las de la pantalla de análisis.
 * Verlas juntas es la única forma de notar que dos de ellas hacen lo mismo o
 * que una quedó con otro criterio de color.
 */

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota: string; ancho?: 'doble' | 'triple'; children: ReactNode;
}>) {
  const span =
    ancho === 'triple' ? '@md:col-span-2 @4xl:col-span-3' : ancho === 'doble' ? '@4xl:col-span-2' : '';
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${span}`}>
      <div className="mb-2">
        <p className="text-xs font-medium text-foreground">{titulo}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>
      </div>
      {children}
    </div>
  );
}

/** Las cinco compactas que usan los dashboards. */
export function GraficosDashboard() {
  return (
    <div className="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-3 @7xl:grid-cols-4">
      <Caja titulo="Tendencia" nota="Serie mensual. Acompaña un panel, sin ejes cargados.">
        <Tendencia datos={SERIE_MESES} alto={110} />
      </Caja>
      <Caja titulo="Anillo" nota="Reparto de un total con el número al centro.">
        <Anillo porciones={PORCIONES} leyendaCentro="reservas" alto={110} />
      </Caja>
      <Caja titulo="Barras horizontales" nota="Ranking corto. Nombres largos sin rotar.">
        <BarrasHorizontales
          alto={110}
          multicolor
          datos={[
            { nombre: 'Estudiante', valor: 81 },
            { nombre: 'Docente', valor: 16 },
            { nombre: 'Externo', valor: 12 },
            { nombre: 'Analista', valor: 3 },
          ]}
        />
      </Caja>
      <Caja titulo="Ritmo semanal" nota="Qué días se usa más. Destaca el pico.">
        <RitmoSemanal
          alto={110}
          datos={Object.fromEntries(DIAS_SEMANA.map((d) => [d.dia, d.valor]))}
        />
      </Caja>
      <Caja titulo="Progreso" nota="Avance contra un total.">
        <div className="space-y-2">
          <Progreso etiqueta="Aprobadas" actual={11171} total={16795} color={MARCA.verde} />
          <Progreso etiqueta="Pendientes" actual={4678} total={16795} color={MARCA.amarillo} />
          <Progreso etiqueta="Canceladas" actual={946} total={16795} color={MARCA.rojo} />
        </div>
      </Caja>
    </div>
  );
}

/** Las catorce de la pantalla de estadísticas. */
export function GraficosEstadisticas() {
  return (
    <div className="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-3 @7xl:grid-cols-4">
      <Caja titulo="Tarjetas KPI" nota="Su propia tira de métricas, distinta de StatStrip." ancho="triple">
        <TarjetasKpi items={KPIS_ESTADISTICAS} />
      </Caja>

      <Caja titulo="Dona" nota="Reparto con leyenda al costado y filtro al clic.">
        <Dona porciones={PORCIONES} leyendaCentro="reservas" tamano={150} />
      </Caja>
      <Caja titulo="Medidor" nota="Un porcentaje contra umbrales. Cambia de color.">
        <div className="flex flex-wrap gap-4">
          <Medidor valor={92} etiqueta="Se aprueban" umbrales={{ alerta: 60, aviso: 80 }} />
          <Medidor valor={45} etiqueta="Sin respuesta" umbrales={{ alerta: 30, aviso: 10 }} masEsPeor />
        </div>
      </Caja>
      <Caja titulo="Waffle" nota="Cien cuadros, uno por cada 1 %. Se lee sin ejes.">
        <Waffle grupos={GRUPOS_WAFFLE} celda={11} />
      </Caja>

      <Caja titulo="Embudo" nota="Cuánto llega de una etapa a la siguiente.">
        <Embudo etapas={ETAPAS_EMBUDO} />
      </Caja>
      <Caja titulo="Apiladas 100 %" nota="Proporciones entre grupos de tamaño muy distinto.">
        <Apiladas100 filas={FILAS_APILADAS} />
      </Caja>
      <Caja titulo="Barras divergentes" nota="Subió o bajó, contra el período anterior.">
        <BarrasDivergentes filas={FILAS_DIVERGENTES} unidad="reservas" />
      </Caja>

      <Caja titulo="Barras por tramos" nota="Composición de cada franja horaria." ancho="doble">
        <BarrasTramos tramos={TRAMOS} unidad="reservas" />
      </Caja>
      <Caja titulo="Mancuernas" nota="Dos valores por fila y la distancia entre ellos.">
        <Mancuernas
          filas={FILAS_MANCUERNA}
          nombreA="Asistieron"
          nombreB="Agendadas"
          colorA={MARCA.verde}
          colorB={MARCA.azul}
        />
      </Caja>

      <Caja titulo="Mapa de árbol" nota="Peso relativo de cada espacio." ancho="doble">
        <MapaArbol nodos={NODOS_ARBOL} alto={220} />
      </Caja>
      <Caja titulo="Radar semanal" nota="Forma de la semana de un vistazo.">
        <RadarSemana dias={DIAS_SEMANA} alto={220} />
      </Caja>

      <Caja titulo="Burbujas" nota="Tres variables: capacidad, ocupación y volumen." ancho="doble">
        <Burbujas
          puntos={PUNTOS_BURBUJA}
          ejeX="Capacidad"
          ejeY="Ocupación %"
          tamano="Reservas"
          alto={240}
        />
      </Caja>
      <Caja titulo="Matriz de calor" nota="Aula contra hora. Dónde se satura.">
        <MatrizCalor
          filas={MATRIZ.filas}
          columnas={MATRIZ.columnas}
          celdas={MATRIZ.celdas}
          etiquetaColumna={(c) => `${c}:00`}
        />
      </Caja>

      <Caja titulo="Calendario de calor" nota="Noventa días. El fin de semana se ve solo." ancho="triple">
        <CalendarioCalor dias={DIAS_CALOR} unidad="reservas" />
      </Caja>
    </div>
  );
}

import { useState, type ReactNode } from 'react';

import type { Comparacion, FactorAsistencia, HeatmapCelda } from '@/lib/api/stats';
import { MARCA } from '@/lib/design/paleta';

import { PanelEstadistica } from '@/components/statistics/PanelEstadistica';
import { Vacio } from '@/components/statistics/Vacio';
import { Estrellas } from '@/components/statistics/academico/Visuales';
import { CompararContra } from '@/components/statistics/reservas/CompararContra';
import { MapaDeCalor } from '@/components/statistics/reservas/MapaDeCalor';
import { MedidorAuc } from '@/components/predicciones/academico/ConfiabilidadAcademico';
import { FactoresEnPalabras, GraficoFactores } from '@/components/predicciones/academico/Factores';
import { TablaDias } from '@/components/predicciones/reservas/TablaDias';
import { SemanaTipica } from '@/components/predicciones/reservas/SemanaTipica';

/**
 * Piezas sueltas de Estadísticas y Predicciones.
 *
 * Dos de ellas son el motivo por el que vale la pena tener esta sección:
 * `PanelEstadistica` es un segundo `Panel` —mismo encabezado oscuro con barra
 * de acento, más un campo de explicación— y `Vacio` es un segundo
 * `EmptyState`. Cada pantalla resolvió por su cuenta lo mismo que ya existía.
 *
 * El resto de estas dos familias pide objetos de dominio completos
 * (`Academico`, `Aprobacion`, `DemandaInventario`…) y aparece como pendiente
 * en el inventario: montarlas bien es armarles el dato entero, no un `as
 * never` que rompa en el navegador.
 */

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: boolean; children: ReactNode;
}>) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${ancho ? '@md:col-span-2' : ''}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Semana laboral cargada, fin de semana vacío: la forma real del campus. */
const CELDAS: HeatmapCelda[] = [];
for (let dia = 0; dia < 7; dia++) {
  for (let hora = 8; hora <= 21; hora++) {
    const finde = dia >= 5;
    const pico = hora >= 17 && hora <= 20;
    CELDAS.push({
      diaSemana: dia,
      hora,
      cant: finde ? (hora % 3) : (pico ? 40 + ((dia * 7 + hora) % 25) : 8 + ((dia * 5 + hora) % 18)),
    });
  }
}

const FACTORES: FactorAsistencia[] = [
  { clave: 'anticipacion', nombre: 'Se agendó con más días', oddsRatio: 1.42, efecto: 'sube' },
  { clave: 'racha', nombre: 'Viene de asistir seguido', oddsRatio: 1.31, efecto: 'sube' },
  { clave: 'presencial', nombre: 'Es presencial', oddsRatio: 1.08, efecto: 'neutro' },
  { clave: 'nocturna', nombre: 'Empieza después de las 20', oddsRatio: 0.74, efecto: 'baja' },
  { clave: 'cupo', nombre: 'Cupo muy grande', oddsRatio: 0.61, efecto: 'baja' },
];

const DIAS = Array.from({ length: 14 }, (_, i) => {
  const fecha = new Date(2026, 8, 18 + i);
  const finde = fecha.getDay() === 0 || fecha.getDay() === 6;
  const esperadas = finde ? 12 + (i % 5) : 78 + ((i * 11) % 40);
  return {
    fecha: fecha.toISOString().slice(0, 10),
    esperadas,
    minimo: Math.round(esperadas * 0.78),
    maximo: Math.round(esperadas * 1.24),
    confirmadas: i < 4 ? Math.round(esperadas * 0.9) : 0,
  };
});

const SEMANA = [
  { dia: 'Lun', valor: 96 },
  { dia: 'Mar', valor: 88 },
  { dia: 'Mié', valor: 94 },
  { dia: 'Jue', valor: 81 },
  { dia: 'Vie', valor: 62 },
  { dia: 'Sáb', valor: 17 },
  { dia: 'Dom', valor: 4 },
];

export function PiezasAnalisis() {
  const [contra, setContra] = useState<Comparacion>('anterior');

  return (
    <div className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
      <Caja titulo="PanelEstadistica" nota="Un segundo Panel. El extra es bueno: obliga a cada panel a explicar qué muestra y de dónde sale.">
        <PanelEstadistica
          title="Cómo evolucionó"
          count="últimos 90 días"
          accentColor={MARCA.azul}
          explicacion={{
            que: '¿Cuántas reservas hubo por semana y cómo viene la tendencia?',
            como: 'Se cuentan las reservas por fecha de inicio dentro del período elegido y se agrupan por semana.',
            lectura: 'Mirar la pendiente antes que los valores sueltos: una semana floja puede ser un feriado.',
            ojo: 'Las canceladas siguen contando: es demanda, no uso.',
            fuente: 'vivo',
          }}
        >
          <SemanaTipica semana={SEMANA} />
        </PanelEstadistica>
      </Caja>

      <Caja titulo="Vacio" nota="Un segundo EmptyState, con otro texto por defecto.">
        <div className="rounded-md border border-dashed border-border">
          <Vacio />
        </div>
        <div className="mt-2 rounded-md border border-dashed border-border">
          <Vacio texto="Nadie se anotó todavía." />
        </div>
      </Caja>

      <Caja titulo="CompararContra" nota="Contra qué período se mide el cambio.">
        <CompararContra valor={contra} onCambiar={setContra} />
      </Caja>

      <Caja titulo="Estrellas" nota="Promedio de calificación de una tutoría.">
        <div className="space-y-1.5">
          <Estrellas valor={4.6} />
          <Estrellas valor={3.2} />
          <Estrellas valor={null} />
          <Estrellas valor={5} chico />
        </div>
      </Caja>

      <Caja titulo="MedidorAuc" nota="Qué tan bien separa el modelo. 0,5 es azar.">
        <div className="flex flex-wrap items-center gap-6">
          <MedidorAuc auc={0.82} grande />
          <MedidorAuc auc={0.61} />
          <MedidorAuc auc={null} />
        </div>
      </Caja>

      <Caja titulo="SemanaTipica" nota="La forma de una semana promedio.">
        <SemanaTipica semana={SEMANA} />
      </Caja>

      <Caja titulo="GraficoFactores" nota="Qué mueve la probabilidad de que asistan.">
        <GraficoFactores factores={FACTORES} />
      </Caja>

      <Caja titulo="FactoresEnPalabras" nota="Lo mismo, explicado en texto.">
        <FactoresEnPalabras factores={FACTORES} />
      </Caja>

      <Caja titulo="MapaDeCalor" nota="Día contra hora. El fin de semana se vacía solo." ancho>
        <MapaDeCalor celdas={CELDAS} />
      </Caja>

      <Caja titulo="TablaDias" nota="Pronóstico por día, con banda y confirmadas." ancho>
        <TablaDias dias={DIAS} />
      </Caja>
    </div>
  );
}

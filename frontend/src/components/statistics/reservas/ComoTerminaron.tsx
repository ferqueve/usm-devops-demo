import type { TotalesReservas } from '@/lib/api/stats';
import { Dona } from '../graficos/Dona';
import { Medidor } from '../graficos/Medidor';
import { useTemaGraficos } from '../graficos/tema';
import { porcentaje } from './formato';

/**
 * Cómo terminaron las reservas del período, separando las pendientes que
 * todavía se pueden resolver de las que vencieron sin que nadie respondiera.
 * Antes eran un único "pendientes, sin resolver", y en los datos más de la
 * mitad ya habían pasado de fecha.
 */
export function ComoTerminaron({ t, grande = false }: Readonly<{ t: TotalesReservas; grande?: boolean }>) {
  const tema = useTemaGraficos();

  if (t.total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No hubo reservas en el período.</p>;
  }

  const porResolver = Math.max(0, t.pendientes - t.pendientesVencidas);
  const resueltas = t.aprobadas + t.canceladas;

  return (
    <div className={grande ? 'grid items-center gap-10 md:grid-cols-[3fr_2fr]' : 'space-y-4'}>
      <Dona
        tamano={grande ? 240 : 140}
        leyendaCentro="reservas"
        porciones={[
          { nombre: 'Aprobadas', valor: t.aprobadas, color: tema.aprobadas },
          { nombre: 'Por resolver', valor: porResolver, color: tema.pendientes },
          { nombre: 'Vencidas', valor: t.pendientesVencidas, color: tema.vencidas },
          { nombre: 'Canceladas', valor: t.canceladas, color: tema.canceladas },
        ]}
      />
      <div className={grande ? 'grid gap-8' : 'grid grid-cols-2 gap-3 border-t pt-3'}>
        <Medidor
          valor={porcentaje(t.aprobadas, resueltas)}
          etiqueta="Se aprueban"
          detalle="de las resueltas"
          umbrales={{ alerta: 60, aviso: 80 }}
          ancho={grande ? 220 : 150}
        />
        <Medidor
          valor={porcentaje(t.pendientesVencidas, t.pendientes)}
          etiqueta="Sin respuesta"
          detalle="de las pendientes vencieron"
          umbrales={{ alerta: 30, aviso: 10 }}
          masEsPeor
          ancho={grande ? 220 : 150}
        />
      </div>
    </div>
  );
}

import { ESTADO_INVENTARIO, EstadoBadge as Pastilla, estadoDe } from '@/components/common/estados';

/**
 * La pastilla de estado de un item de inventario.
 *
 * El mapa vive en `components/common/estados`: era uno de nueve repartidos
 * por los componentes, varios idénticos entre sí.
 */
export function EstadoBadge({ estado }: Readonly<{ estado: string }>) {
  return <Pastilla estado={estadoDe(ESTADO_INVENTARIO, estado)} />;
}

import { inventarioApi } from '@/lib/api/inventory';
import type { InventarioItem } from '@/lib/types/spaces';

interface MoveQuantityArgs {
  item: InventarioItem;
  /** Destination espacio id. Use 0 for "sin asignar". */
  targetEspacioId: number;
  /** Quantity to move to the target. */
  cantidad: number;
  /** Permission check for splitting (creating a new item). */
  canSplit: () => boolean;
  /** Callback invoked when split is required but the user lacks permission. */
  onSplitDenied: () => void;
}

/**
 * Moves `cantidad` units of `item` to `targetEspacioId`.
 *
 * - If `cantidad` equals item.cantidad: updates the existing item with the new espacio.
 * - Otherwise: reduces the original item's quantity and creates a new item at the target,
 *   provided the caller has split permission.
 *
 * Returns true if the operation completed, false if denied (split without permission).
 */
export async function moveInventoryQuantity({
  item,
  targetEspacioId,
  cantidad,
  canSplit,
  onSplitDenied,
}: MoveQuantityArgs): Promise<boolean> {
  if (cantidad < item.cantidad) {
    if (!canSplit()) {
      onSplitDenied();
      return false;
    }

    await inventarioApi.actualizarInventarioItem(item.id, {
      espacioId: item.espacioId,
      tipoElementoId: item.tipoElementoId,
      cantidad: item.cantidad - cantidad,
      estado: item.estado,
      observaciones: item.observaciones,
    });

    await inventarioApi.crearInventarioItem({
      espacioId: targetEspacioId,
      tipoElementoId: item.tipoElementoId,
      cantidad,
      estado: item.estado,
      observaciones: item.observaciones,
    });
    return true;
  }

  await inventarioApi.actualizarInventarioItem(item.id, {
    espacioId: targetEspacioId,
    tipoElementoId: item.tipoElementoId,
    cantidad: item.cantidad,
    estado: item.estado,
    observaciones: item.observaciones,
  });
  return true;
}

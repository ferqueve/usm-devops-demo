import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moveInventoryQuantity } from '@/components/inventory/_shared/inventoryAssignment';
import type { InventarioItem } from '@/lib/types/spaces';

vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: {
    actualizarInventarioItem: vi.fn().mockResolvedValue({ data: {} }),
    crearInventarioItem: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { inventarioApi } from '@/lib/api/inventory';

const baseItem: InventarioItem = {
  id: 10,
  espacioId: 1,
  espacioNombre: 'A',
  tipoElementoId: 2,
  tipoElementoNombre: 'X',
  cantidad: 5,
  estado: 'DISPONIBLE',
  observaciones: 'obs',
  activo: true,
  createdAt: '',
  updatedAt: '',
};

describe('moveInventoryQuantity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('actualiza el item en lugar (sin split) cuando cantidad coincide', async () => {
    const ok = await moveInventoryQuantity({
      item: baseItem,
      targetEspacioId: 7,
      cantidad: 5,
      canSplit: () => true,
      onSplitDenied: vi.fn(),
    });

    expect(ok).toBe(true);
    expect(inventarioApi.actualizarInventarioItem).toHaveBeenCalledWith(10, expect.objectContaining({ espacioId: 7, cantidad: 5 }));
    expect(inventarioApi.crearInventarioItem).not.toHaveBeenCalled();
  });

  it('hace split cuando cantidad es menor y hay permiso', async () => {
    const ok = await moveInventoryQuantity({
      item: baseItem,
      targetEspacioId: 7,
      cantidad: 2,
      canSplit: () => true,
      onSplitDenied: vi.fn(),
    });

    expect(ok).toBe(true);
    expect(inventarioApi.actualizarInventarioItem).toHaveBeenCalledWith(10, expect.objectContaining({ cantidad: 3 }));
    expect(inventarioApi.crearInventarioItem).toHaveBeenCalledWith(expect.objectContaining({ espacioId: 7, cantidad: 2 }));
  });

  it('rechaza el split cuando no hay permiso', async () => {
    const onSplitDenied = vi.fn();
    const ok = await moveInventoryQuantity({
      item: baseItem,
      targetEspacioId: 7,
      cantidad: 2,
      canSplit: () => false,
      onSplitDenied,
    });

    expect(ok).toBe(false);
    expect(onSplitDenied).toHaveBeenCalled();
    expect(inventarioApi.actualizarInventarioItem).not.toHaveBeenCalled();
  });
});

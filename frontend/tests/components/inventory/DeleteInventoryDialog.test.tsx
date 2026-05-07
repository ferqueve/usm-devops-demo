import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const eliminarInventarioItem = vi.fn();
vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: {
    eliminarInventarioItem: (...args: unknown[]) => eliminarInventarioItem(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import DeleteInventoryDialog from '@/components/inventory/DeleteInventoryDialog';

const item = {
  id: 5,
  tipoElementoNombre: 'Proyector',
} as never;

describe('DeleteInventoryDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza el nombre del item', () => {
    render(<DeleteInventoryDialog item={item} open onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText('Proyector')).toBeInTheDocument();
  });

  it('llama a la API y onSuccess al confirmar', async () => {
    eliminarInventarioItem.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    render(<DeleteInventoryDialog item={item} open onOpenChange={onOpenChange} onSuccess={onSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(eliminarInventarioItem).toHaveBeenCalledWith(5));
    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

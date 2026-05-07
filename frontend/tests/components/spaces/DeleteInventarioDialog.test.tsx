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

import { DeleteInventarioDialog } from '@/components/spaces/DeleteInventarioDialog';

const inventarioItem = {
  id: 9,
  tipoElementoNombre: 'Mesa',
  cantidad: 3,
} as never;

describe('DeleteInventarioDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra los datos del elemento', () => {
    render(
      <DeleteInventarioDialog
        inventarioItem={inventarioItem}
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Mesa')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('confirma eliminación e invoca onSuccess', async () => {
    eliminarInventarioItem.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(
      <DeleteInventarioDialog
        inventarioItem={inventarioItem}
        open
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(eliminarInventarioItem).toHaveBeenCalledWith(9);
  });
});

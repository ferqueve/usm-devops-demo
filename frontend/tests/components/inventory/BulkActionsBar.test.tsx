import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import BulkActionsBar from '@/components/inventory/BulkActionsBar';

describe('BulkActionsBar', () => {
  it('muestra el conteo singular/plural correctamente', () => {
    const { rerender } = render(
      <BulkActionsBar
        selectedCount={1}
        onBulkStateChange={vi.fn()}
        onBulkAssign={vi.fn()}
        onBulkUnassign={vi.fn()}
        onBulkExport={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );
    expect(screen.getByText('1 item seleccionado')).toBeInTheDocument();

    rerender(
      <BulkActionsBar
        selectedCount={5}
        onBulkStateChange={vi.fn()}
        onBulkAssign={vi.fn()}
        onBulkUnassign={vi.fn()}
        onBulkExport={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );
    expect(screen.getByText('5 items seleccionados')).toBeInTheDocument();
  });

  it('dispara los callbacks al hacer click', async () => {
    const onBulkAssign = vi.fn();
    const onClearSelection = vi.fn();
    render(
      <BulkActionsBar
        selectedCount={2}
        onBulkStateChange={vi.fn()}
        onBulkAssign={onBulkAssign}
        onBulkUnassign={vi.fn()}
        onBulkExport={vi.fn()}
        onClearSelection={onClearSelection}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Asignar Espacio/ }));
    expect(onBulkAssign).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Limpiar/ }));
    expect(onClearSelection).toHaveBeenCalled();
  });
});
